"""
AURA MINI - Incidents API Router
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
from database import get_db
from schemas import Incident, IncidentCreate, IncidentEvent
from services.rca import perform_rca

router = APIRouter(prefix="/api/incidents", tags=["Incidents"])


@router.get("", response_model=List[Incident])
def get_incidents(
    status: Optional[str] = Query(None, description="Filter by status (e.g. DETECTED, RESOLVED, FAILED)"),
    limit: int = Query(50, description="Max incidents to return")
):
    """Retrieve list of system incidents, sorted by most recent first."""
    with get_db() as conn:
        cursor = conn.cursor()
        if status:
            cursor.execute("""
                SELECT * FROM incidents
                WHERE status = %s
                ORDER BY created_at DESC
                LIMIT %s
            """, (status, limit))
            rows = cursor.fetchall()
        else:
            cursor.execute("""
                SELECT * FROM incidents
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit,))
            rows = cursor.fetchall()

        incidents = []
        for r in rows:
            inc_dict = dict(r)
            # Fetch events
            cursor.execute("""
                SELECT * FROM incident_events
                WHERE incident_id = %s
                ORDER BY id ASC
            """, (inc_dict["id"],))
            ev_rows = cursor.fetchall()
            inc_dict["events"] = [dict(ev) for ev in ev_rows]

            # Fetch recovery action if available
            cursor.execute("""
                SELECT * FROM recovery_actions
                WHERE incident_id = %s
                ORDER BY id DESC LIMIT 1
            """, (inc_dict["id"],))
            rec_row = cursor.fetchone()
            inc_dict["recovery_action"] = dict(rec_row) if rec_row else None

            incidents.append(inc_dict)

        return incidents


@router.get("/{incident_id}", response_model=Incident)
def get_incident_by_id(incident_id: str):
    """Retrieve full incident details including visual timeline events and recovery audits."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents WHERE id = %s", (incident_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")

        inc_dict = dict(row)

        # Fetch events for timeline
        cursor.execute("""
            SELECT * FROM incident_events
            WHERE incident_id = %s
            ORDER BY id ASC
        """, (incident_id,))
        ev_rows = cursor.fetchall()
        inc_dict["events"] = [dict(ev) for ev in ev_rows]

        # Fetch recovery action
        cursor.execute("""
            SELECT * FROM recovery_actions
            WHERE incident_id = %s
            ORDER BY id DESC LIMIT 1
        """, (incident_id,))
        rec_row = cursor.fetchone()
        inc_dict["recovery_action"] = dict(rec_row) if rec_row else None

        return inc_dict


@router.get("/{incident_id}/events", response_model=List[IncidentEvent])
def get_incident_events(incident_id: str):
    """Retrieve chronological event stream for a specific incident."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM incident_events
            WHERE incident_id = %s
            ORDER BY id ASC
        """, (incident_id,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


@router.post("/{incident_id}/rca")
def trigger_rca_endpoint(incident_id: str) -> Dict[str, Any]:
    """Manually trigger or re-run Root Cause Analysis on an incident."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents WHERE id = %s", (incident_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
        incident = dict(row)

    return perform_rca(incident)


@router.delete("/clear")
def clear_all_incidents() -> Dict[str, str]:
    """Clear all incident history (useful for fresh demo restarts)."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM incident_events")
        cursor.execute("DELETE FROM recovery_actions")
        cursor.execute("DELETE FROM incidents")
    return {"status": "SUCCESS", "message": "All incident records cleared."}
