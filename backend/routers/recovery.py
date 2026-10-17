"""
AURA MINI - Autonomous Recovery API Router
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Dict, Any, Optional
from database import get_db
from schemas import RecoveryAction
from services.remediation import execute_remediation
from services.verification import verify_recovery

router = APIRouter(prefix="/api/recovery", tags=["Autonomous Recovery"])


@router.get("/active")
def get_active_remediations() -> List[Dict[str, Any]]:
    """Retrieve currently active remediation actions."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT r.*, i.type as incident_type, i.severity, i.metric, i.threshold
            FROM recovery_actions r
            JOIN incidents i ON r.incident_id = i.id
            WHERE r.status = 'EXECUTING' OR i.status IN ('REMEDIATING', 'VERIFYING')
            ORDER BY r.id DESC
        """)
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


@router.get("/history", response_model=List[RecoveryAction])
def get_recovery_history(limit: int = Query(50, description="Max recovery actions to return")):
    """Retrieve audit history of all executed remediations and verification results."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM recovery_actions
            ORDER BY id DESC
            LIMIT %s
        """, (limit,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


@router.post("/incidents/{incident_id}/remediate")
def trigger_remediation_endpoint(incident_id: str) -> Dict[str, Any]:
    """Execute autonomous remediation runbook for a specified incident."""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents WHERE id = %s", (incident_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
        incident = dict(row)

    return execute_remediation(incident)


@router.post("/incidents/{incident_id}/verify")
def trigger_verification_endpoint(
    incident_id: str,
    simulate_failure: bool = Query(False, description="Simulate an unsuccessful recovery to demonstrate escalation")
) -> Dict[str, Any]:
    """Execute post-remediation verification measurement on an incident."""
    try:
        return verify_recovery(incident_id, is_failure_scenario=simulate_failure)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
