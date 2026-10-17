"""
AURA MINI - Incident Detection Service (Module 2: Incident Detection)
Monitors telemetry against dynamic thresholds and detects anomalies.
"""

import datetime
from typing import Optional, Dict, Any
from database import get_db
from utils.logger import log_event


def get_thresholds() -> Dict[str, float]:
    """Load configurable thresholds from SQLite settings."""
    thresholds = {
        "cpu": 80.0,
        "memory": 85.0,
        "disk": 90.0
    }
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT key, value FROM system_settings")
            rows = cursor.fetchall()
            for row in rows:
                if row["key"] == "cpu_threshold":
                    thresholds["cpu"] = float(row["value"])
                elif row["key"] == "memory_threshold":
                    thresholds["memory"] = float(row["value"])
                elif row["key"] == "disk_threshold":
                    thresholds["disk"] = float(row["value"])
    except Exception:
        pass
    return thresholds


def is_auto_remediation_enabled() -> bool:
    """Check if autonomous remediation is enabled in settings."""
    try:
        with get_db() as conn:
            row = conn.execute("SELECT value FROM system_settings WHERE key='auto_remediation_enabled'").fetchone()
            if row:
                return row["value"].lower() == "true"
    except Exception:
        pass
    return True


def generate_incident_id() -> str:
    """Generate incremental incident ID like INC-001, INC-002."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) as count FROM incidents")
        row = cursor.fetchone()
        count = row["count"] + 1 if row else 1
        return f"INC-{count:03d}"


def detect_incidents(metrics: Dict[str, Any], sim_error_log: Optional[str] = None) -> Optional[Dict[str, Any]]:
    """
    Evaluates current metrics against system thresholds.
    If an anomaly is found and no active incident exists for this metric, creates a new incident.
    """
    thresholds = get_thresholds()
    now_str = datetime.datetime.now().strftime("%H:%M:%S")

    incident_candidate = None

    # Check 1: CPU Anomaly
    if metrics["cpu"] > thresholds["cpu"]:
        severity = "CRITICAL" if metrics["cpu"] >= 90.0 else "HIGH"
        incident_candidate = {
            "type": "HIGH CPU",
            "severity": severity,
            "metric": "cpu",
            "current_value": metrics["cpu"],
            "threshold": thresholds["cpu"],
            "message": f"CPU utilization ({metrics['cpu']}%) exceeded threshold ({thresholds['cpu']}%)"
        }

    # Check 2: Memory Anomaly
    elif metrics["memory"] > thresholds["memory"]:
        severity = "CRITICAL" if metrics["memory"] >= 92.0 else "HIGH"
        incident_candidate = {
            "type": "HIGH MEMORY",
            "severity": severity,
            "metric": "memory",
            "current_value": metrics["memory"],
            "threshold": thresholds["memory"],
            "message": f"Memory utilization ({metrics['memory']}%) exceeded threshold ({thresholds['memory']}%)"
        }

    # Check 3: Disk Space Anomaly
    elif metrics["disk"] > thresholds["disk"]:
        severity = "CRITICAL" if metrics["disk"] >= 95.0 else "HIGH"
        incident_candidate = {
            "type": "DISK PRESSURE",
            "severity": severity,
            "metric": "disk",
            "current_value": metrics["disk"],
            "threshold": thresholds["disk"],
            "message": f"Disk utilization ({metrics['disk']}%) exceeded threshold ({thresholds['disk']}%)"
        }

    # Check 4: Application Error / Log Anomaly
    elif sim_error_log is not None:
        incident_candidate = {
            "type": "APPLICATION FAILURE",
            "severity": "CRITICAL",
            "metric": "app_health",
            "current_value": 0.0,
            "threshold": 1.0,
            "message": f"Application error detected: {sim_error_log}"
        }

    if not incident_candidate:
        return None

    # Check if there is already an active (unresolved) incident for this metric
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, status FROM incidents 
            WHERE metric = %s AND status NOT IN ('RESOLVED', 'FAILED')
            ORDER BY created_at DESC LIMIT 1
        """, (incident_candidate["metric"],))
        existing = cursor.fetchone()

        if existing:
            # Incident already actively being handled
            return None

        # Create new incident
        inc_id = generate_incident_id()
        cursor.execute("""
            INSERT INTO incidents (
                id, type, severity, status, metric, current_value, threshold, 
                root_cause, confidence, evidence, recommended_action, created_at, resolved_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, NULL, NULL, NULL, NULL, %s, NULL)
        """, (
            inc_id,
            incident_candidate["type"],
            incident_candidate["severity"],
            "DETECTED",
            incident_candidate["metric"],
            incident_candidate["current_value"],
            incident_candidate["threshold"],
            now_str
        ))

        # Record Detection Event in timeline
        cursor.execute("""
            INSERT INTO incident_events (incident_id, event_type, message, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (
            inc_id,
            "DETECTION",
            f"Incident detected: {incident_candidate['message']}",
            now_str
        ))

    log_event("WARNING", "DETECTOR", f"Created incident {inc_id}: {incident_candidate['type']} ({incident_candidate['current_value']}%)")

    return {
        "id": inc_id,
        "type": incident_candidate["type"],
        "severity": incident_candidate["severity"],
        "metric": incident_candidate["metric"],
        "current_value": incident_candidate["current_value"],
        "threshold": incident_candidate["threshold"],
        "status": "DETECTED",
        "created_at": now_str
    }
