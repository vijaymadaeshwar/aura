"""
AURA - Automated Remediation Service (Module 5: Automated Remediation)
Safely executes runbook recovery actions with explicit step-by-step progress tracking.
"""

import datetime
import time
from typing import Dict, Any
from database import get_db
from utils.logger import log_event
from services.runbook import select_runbook_for_incident


def execute_remediation(incident: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes the autonomous remediation action for an incident.
    Records lifecycle state in SQLite: DETECTED/INVESTIGATING -> REMEDIATING -> VERIFYING.
    """
    inc_id = incident["id"]
    runbook = select_runbook_for_incident(incident)
    start_time_str = datetime.datetime.now().strftime("%H:%M:%S")

    # 1. Update Incident status to REMEDIATING
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE incidents
            SET status = 'REMEDIATING'
            WHERE id = %s
        """, (inc_id,))

        # 2. Insert into recovery_actions table
        cursor.execute("""
            INSERT INTO recovery_actions (
                incident_id, runbook_id, action_name, status, before_value, after_value, started_at, completed_at
            ) VALUES (%s, %s, %s, 'EXECUTING', %s, NULL, %s, NULL)
            RETURNING id
        """, (
            inc_id,
            runbook["id"],
            runbook["action"],
            incident["current_value"],
            start_time_str
        ))
        row = cursor.fetchone()
        action_id = row["id"] if isinstance(row, dict) else row[0]

        # 3. Add timeline event
        cursor.execute("""
            INSERT INTO incident_events (incident_id, event_type, message, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (
            inc_id,
            "REMEDIATION_STARTED",
            f"Remediation initiated: Selected runbook '{runbook['id']}'. Executing: {runbook['action']}",
            start_time_str
        ))

    log_event("INFO", "REMEDIATION", f"Incident {inc_id}: Executing runbook {runbook['id']} - {runbook['action']}")

    # Small pause to represent realistic process restart / cache purge execution
    time.sleep(0.5)

    comp_time_str = datetime.datetime.now().strftime("%H:%M:%S")

    # 4. Mark action execution complete and transition incident to VERIFYING
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE incidents
            SET status = 'VERIFYING'
            WHERE id = %s
        """, (inc_id,))

        cursor.execute("""
            UPDATE recovery_actions
            SET completed_at = %s
            WHERE id = %s
        """, (comp_time_str, action_id))

        cursor.execute("""
            INSERT INTO incident_events (incident_id, event_type, message, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (
            inc_id,
            "REMEDIATION_FINISHED",
            f"Action completed: '{runbook['action']}'. Commencing recovery verification measurement...",
            comp_time_str
        ))

    log_event("INFO", "REMEDIATION", f"Incident {inc_id}: Remediation action completed. Moving to verification.")

    return {
        "action_id": action_id,
        "incident_id": inc_id,
        "runbook": runbook,
        "status": "COMPLETED",
        "started_at": start_time_str,
        "completed_at": comp_time_str
    }
