"""
AURA - System Settings API Router
"""

from fastapi import APIRouter
from typing import Dict, Any
from database import get_db
from schemas import SystemSettings
from utils.logger import log_event

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("", response_model=SystemSettings)
def get_settings():
    """Retrieve system configuration settings and detection thresholds."""
    settings = SystemSettings()
    try:
        with get_db() as conn:
            rows = conn.execute("SELECT key, value FROM system_settings").fetchall()
            for r in rows:
                k, v = r["key"], r["value"]
                if k == "cpu_threshold":
                    settings.cpu_threshold = float(v)
                elif k == "memory_threshold":
                    settings.memory_threshold = float(v)
                elif k == "disk_threshold":
                    settings.disk_threshold = float(v)
                elif k == "auto_remediation_enabled":
                    settings.auto_remediation_enabled = (v.lower() == "true")
                elif k == "polling_interval_sec":
                    settings.polling_interval_sec = float(v)
    except Exception:
        pass
    return settings


@router.put("", response_model=SystemSettings)
def update_settings(payload: SystemSettings):
    """Update detection thresholds or autonomous remediation policy."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE system_settings SET value = %s WHERE key = 'cpu_threshold'", (str(payload.cpu_threshold),))
        cursor.execute("UPDATE system_settings SET value = %s WHERE key = 'memory_threshold'", (str(payload.memory_threshold),))
        cursor.execute("UPDATE system_settings SET value = %s WHERE key = 'disk_threshold'", (str(payload.disk_threshold),))
        cursor.execute("UPDATE system_settings SET value = %s WHERE key = 'auto_remediation_enabled'", (str(payload.auto_remediation_enabled).lower(),))
        cursor.execute("UPDATE system_settings SET value = %s WHERE key = 'polling_interval_sec'", (str(payload.polling_interval_sec),))

    log_event("INFO", "SETTINGS", f"Updated settings: CPU={payload.cpu_threshold}%, AutoRemediate={payload.auto_remediation_enabled}")
    return payload
