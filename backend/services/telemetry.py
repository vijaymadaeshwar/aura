"""
AURA - System Telemetry Service (Module 1: Observability)
Collects host metrics using psutil and maintains historical telemetry snapshots.
Supports non-destructive simulation overlays for safe live demonstrations.
"""

import time
import datetime
import os
import psutil
from typing import Dict, Any, List, Optional
from database import get_db
from utils.logger import log_event

# In-memory simulation state overlay
_simulation_state: Dict[str, Any] = {
    "active": False,
    "scenario": None,
    "override_cpu": None,
    "override_memory": None,
    "override_disk": None,
    "override_app_health": "UP",
    "last_error_log": None
}

# Track network transfer delta
_last_net_bytes = 0
_last_net_time = time.time()


def set_simulation_override(
    scenario: str,
    cpu: Optional[float] = None,
    memory: Optional[float] = None,
    disk: Optional[float] = None,
    app_health: str = "UP",
    error_log: Optional[str] = None
) -> None:
    """Set simulation telemetry values."""
    global _simulation_state
    _simulation_state["active"] = True
    _simulation_state["scenario"] = scenario
    _simulation_state["override_cpu"] = cpu
    _simulation_state["override_memory"] = memory
    _simulation_state["override_disk"] = disk
    _simulation_state["override_app_health"] = app_health
    _simulation_state["last_error_log"] = error_log

    log_event("WARNING", "SIMULATOR", f"Simulation state updated: {scenario} (CPU={cpu}, MEM={memory})")


def clear_simulation_override() -> None:
    """Clear simulation telemetry and return to normal live observation."""
    global _simulation_state
    _simulation_state = {
        "active": False,
        "scenario": None,
        "override_cpu": None,
        "override_memory": None,
        "override_disk": None,
        "override_app_health": "UP",
        "last_error_log": None
    }
    log_event("INFO", "SIMULATOR", "Simulation override cleared. Restored live hardware observation.")


def is_simulation_active() -> bool:
    """Check if simulation is currently active."""
    return _simulation_state["active"]


def get_simulation_state() -> Dict[str, Any]:
    """Get active simulation state."""
    return dict(_simulation_state)


def get_uptime_info() -> Dict[str, Any]:
    """Calculate system uptime."""
    try:
        boot_time = psutil.boot_time()
        uptime_seconds = time.time() - boot_time
        days = int(uptime_seconds // (24 * 3600))
        hours = int((uptime_seconds % (24 * 3600)) // 3600)
        minutes = int((uptime_seconds % 3600) // 60)

        if days > 0:
            formatted = f"{days}d {hours}h {minutes}m"
        else:
            formatted = f"{hours}h {minutes}m"

        return {
            "uptime_seconds": uptime_seconds,
            "uptime_formatted": formatted
        }
    except Exception:
        return {
            "uptime_seconds": 3600,
            "uptime_formatted": "1h 00m"
        }


def get_network_rate_mb_s() -> float:
    """Calculate combined network transfer rate in MB/s."""
    global _last_net_bytes, _last_net_time
    try:
        net_io = psutil.net_io_counters()
        current_bytes = net_io.bytes_sent + net_io.bytes_recv
        current_time = time.time()

        time_delta = current_time - _last_net_time
        if time_delta <= 0 or _last_net_bytes == 0:
            _last_net_bytes = current_bytes
            _last_net_time = current_time
            return 1.2  # baseline display rate

        bytes_delta = current_bytes - _last_net_bytes
        _last_net_bytes = current_bytes
        _last_net_time = current_time

        mb_s = (bytes_delta / (1024 * 1024)) / time_delta
        return round(max(0.1, mb_s), 2)
    except Exception:
        return 0.5


def collect_system_metrics() -> Dict[str, Any]:
    """
    Module 1: System Observability
    Collect CPU, Memory, Disk, Network usage, and Uptime.
    Applies simulation overrides if an incident simulation is running.
    """
    # 1. Real psutil hardware metrics
    try:
        real_cpu = psutil.cpu_percent(interval=None)
        # psutil interval=None can return 0.0 on first call, default to sensible baseline if 0
        if real_cpu == 0.0:
            real_cpu = 15.0
    except Exception:
        real_cpu = 20.0

    try:
        real_memory = psutil.virtual_memory().percent
    except Exception:
        real_memory = 55.0

    try:
        # Check system root path for disk
        root_path = "C:\\" if os.name == "nt" else "/"
        real_disk = psutil.disk_usage(root_path).percent
    except Exception:
        real_disk = 45.0

    real_net = get_network_rate_mb_s()
    uptime_data = get_uptime_info()

    # 2. Check for simulation overrides
    is_simulated = _simulation_state["active"]
    cpu = _simulation_state["override_cpu"] if (is_simulated and _simulation_state["override_cpu"] is not None) else real_cpu
    memory = _simulation_state["override_memory"] if (is_simulated and _simulation_state["override_memory"] is not None) else real_memory
    disk = _simulation_state["override_disk"] if (is_simulated and _simulation_state["override_disk"] is not None) else real_disk

    # 3. Determine overall health status
    if cpu >= 85.0 or memory >= 90.0 or disk >= 95.0 or _simulation_state["override_app_health"] == "DOWN":
        status = "CRITICAL"
    elif cpu >= 75.0 or memory >= 80.0 or disk >= 85.0:
        status = "WARNING"
    else:
        status = "HEALTHY"

    timestamp_str = datetime.datetime.now().strftime("%H:%M:%S")

    # Count active incidents from DB
    active_count = 0
    try:
        with get_db() as conn:
            row = conn.execute("SELECT COUNT(*) as cnt FROM incidents WHERE status NOT IN ('RESOLVED')").fetchone()
            if row:
                active_count = row["cnt"]
    except Exception:
        pass

    metrics_payload = {
        "cpu": round(cpu, 1),
        "memory": round(memory, 1),
        "disk": round(disk, 1),
        "network_mb_s": round(real_net, 2),
        "uptime_seconds": uptime_data["uptime_seconds"],
        "uptime_formatted": uptime_data["uptime_formatted"],
        "status": status,
        "timestamp": timestamp_str,
        "active_incidents_count": active_count,
        "is_simulated": is_simulated
    }

    # Record snapshot into database for chart sliding window
    try:
        with get_db() as conn:
            conn.execute("""
                INSERT INTO telemetry_history (cpu, memory, disk, network_mb_s, timestamp)
                VALUES (%s, %s, %s, %s, %s)
            """, (metrics_payload["cpu"], metrics_payload["memory"], metrics_payload["disk"], metrics_payload["network_mb_s"], timestamp_str))
            
            # Keep only last 100 historical points
            conn.execute("""
                DELETE FROM telemetry_history 
                WHERE id NOT IN (
                    SELECT id FROM (
                        SELECT id FROM telemetry_history ORDER BY id DESC LIMIT 100
                    ) sub
                )
            """)
    except Exception:
        pass

    return metrics_payload


def get_telemetry_history(limit: int = 30) -> List[Dict[str, Any]]:
    """Retrieve recent telemetry data points for real-time frontend charts."""
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT id, cpu, memory, disk, network_mb_s, timestamp
                FROM telemetry_history
                ORDER BY id DESC
                LIMIT %s
            """, (limit,))
            rows = cursor.fetchall()
            
            history = [dict(r) for r in reversed(rows)]
            return history
    except Exception:
        return []
