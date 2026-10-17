"""
AURA MINI - Recovery Verification Service (Module 6: Recovery Verification)
Enforces closed-loop verification: re-measures telemetry to confirm true recovery.
Distinguishes between 'ACTION EXECUTED' vs 'SYSTEM RECOVERED'.
"""

import datetime
from typing import Dict, Any
from database import get_db
from utils.logger import log_event
from services.telemetry import collect_system_metrics, is_simulation_active, get_simulation_state, clear_simulation_override, set_simulation_override


def verify_recovery(incident_id: str, is_failure_scenario: bool = False) -> Dict[str, Any]:
    """
    Module 6: Recovery Verification
    Re-measures the system metric post-remediation and compares with threshold.
    Updates incident to RESOLVED (if successful) or FAILED (if recovery failed).
    """
    now_str = datetime.datetime.now().strftime("%H:%M:%S")

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM incidents WHERE id = %s", (incident_id,))
        inc = cursor.fetchone()
        if not inc:
            raise ValueError(f"Incident {incident_id} not found.")

        incident = dict(inc)
        metric = incident["metric"]
        threshold = incident["threshold"]
        before_value = incident["current_value"]

    # If active simulation, determine the post-remediation metric value
    if is_simulation_active():
        sim_state = get_simulation_state()
        scenario = sim_state.get("scenario")

        if is_failure_scenario or scenario == "recovery-failure":
            # Simulated Failure: metric barely drops, remains well above threshold
            if metric == "cpu":
                after_value = 91.5
            elif metric == "memory":
                after_value = 89.0
            else:
                after_value = before_value - 2.0
            is_recovered = False
            # Keep elevated state to reflect ongoing failure
            set_simulation_override(scenario="recovery-failure", cpu=after_value)
        else:
            # Simulated Success: healthy post-recovery values
            if metric == "cpu":
                after_value = 42.5
            elif metric == "memory":
                after_value = 52.0
            elif metric == "disk":
                after_value = 65.0
            elif metric == "app_health":
                after_value = 1.0
            else:
                after_value = threshold - 15.0
            is_recovered = True
            # Clear simulation override so live metrics return to normal
            clear_simulation_override()
    else:
        # Measure real host telemetry via psutil
        fresh_metrics = collect_system_metrics()
        if metric == "cpu":
            after_value = fresh_metrics["cpu"]
        elif metric == "memory":
            after_value = fresh_metrics["memory"]
        elif metric == "disk":
            after_value = fresh_metrics["disk"]
        else:
            after_value = 1.0

        is_recovered = after_value < threshold

    # Update Database with Verification Results
    with get_db() as conn:
        cursor = conn.cursor()

        if is_recovered:
            final_status = "RESOLVED"
            result_message = f"✓ RECOVERY SUCCESSFUL: {metric.upper()} reduced from {before_value}% → {after_value}% (threshold: {threshold}%)."
            event_type = "VERIFICATION_PASSED"

            cursor.execute("""
                UPDATE incidents
                SET status = 'RESOLVED',
                    resolved_at = %s
                WHERE id = %s
            """, (now_str, incident_id))

            cursor.execute("""
                UPDATE recovery_actions
                SET status = 'SUCCESSFUL',
                    after_value = %s
                WHERE incident_id = %s
            """, (after_value, incident_id))

        else:
            final_status = "FAILED"
            result_message = f"✗ RECOVERY FAILED: {metric.upper()} measured at {after_value}%, still exceeding threshold of {threshold}%."
            event_type = "VERIFICATION_FAILED"

            cursor.execute("""
                UPDATE incidents
                SET status = 'FAILED'
                WHERE id = %s
            """, (incident_id,))

            cursor.execute("""
                UPDATE recovery_actions
                SET status = 'FAILED',
                    after_value = %s
                WHERE incident_id = %s
            """, (after_value, incident_id))

        # Add Verification Event to Timeline
        cursor.execute("""
            INSERT INTO incident_events (incident_id, event_type, message, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (incident_id, event_type, result_message, now_str))

        # If failed, add escalation event
        if not is_recovered:
            cursor.execute("""
                INSERT INTO incident_events (incident_id, event_type, message, timestamp)
                VALUES (%s, %s, %s, %s)
            """, (
                incident_id,
                "ESCALATED",
                "Autonomous remediation was insufficient. Incident escalated to Tier-2 SRE On-Call.",
                now_str
            ))

    log_event(
        "INFO" if is_recovered else "ERROR",
        "VERIFICATION",
        f"Incident {incident_id} verification result: {final_status} ({before_value}% -> {after_value}%)"
    )

    return {
        "incident_id": incident_id,
        "is_recovered": is_recovered,
        "status": final_status,
        "metric": metric,
        "threshold": threshold,
        "before_value": before_value,
        "after_value": after_value,
        "message": result_message,
        "timestamp": now_str
    }
