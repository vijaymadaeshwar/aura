"""
AURA MINI - Events & Logs API Router
"""

from fastapi import APIRouter, Query
from typing import List, Dict, Any
from database import get_db
from utils.logger import get_recent_logs

router = APIRouter(prefix="/api/events", tags=["Events & Logs"])


@router.get("")
def get_all_events(limit: int = Query(50, description="Max events to return")):
    """Retrieve system timeline events across all incidents."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT e.*, i.type as incident_type, i.severity
            FROM incident_events e
            LEFT JOIN incidents i ON e.incident_id = i.id
            ORDER BY e.id DESC
            LIMIT %s
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


@router.get("/logs")
def get_system_logs(limit: int = Query(50, description="Max log lines to return")):
    """Retrieve circular buffer of recent runtime/application logs."""
    return get_recent_logs(limit=limit)
