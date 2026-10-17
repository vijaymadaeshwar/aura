"""
AURA - Incident Simulator Service (Module 7: Incident Simulator)
Generates safe, controlled reliability incidents for demonstration and testing.
Supports automated closed-loop execution and step-by-step interactive inspection.
"""

import time
from typing import Dict, Any
from utils.logger import log_event
from services.telemetry import set_simulation_override, clear_simulation_override, collect_system_metrics
from services.detector import detect_incidents, is_auto_remediation_enabled
from services.rca import perform_rca
from services.remediation import execute_remediation
from services.verification import verify_recovery


def trigger_simulation(scenario: str, auto_execute_loop: bool = True) -> Dict[str, Any]:
    """
    Trigger a safe simulated incident scenario.
    If auto_execute_loop is True and auto-remediation is enabled, runs the full:
    OBSERVE -> DETECT -> DIAGNOSE -> REMEDIATE -> VERIFY loop.
    """
    log_event("WARNING", "SIMULATOR", f"Triggering simulation scenario: '{scenario}'")

    # 1. Configure simulation telemetry overlay
    if scenario == "high-cpu":
        set_simulation_override(scenario="high-cpu", cpu=94.2, memory=62.0)
        initial_metric = 94.2
        error_log = None
    elif scenario == "high-memory":
        set_simulation_override(scenario="high-memory", cpu=38.0, memory=94.5)
        initial_metric = 94.5
        error_log = None
    elif scenario == "application-failure":
        set_simulation_override(scenario="application-failure", cpu=45.0, memory=58.0, app_health="DOWN", error_log="FATAL: Database connection pool timed out after 30000ms. 0 free connections.")
        initial_metric = 0.0
        error_log = "Database connection pool exhausted (HTTP 500)"
    elif scenario == "recovery-failure":
        set_simulation_override(scenario="recovery-failure", cpu=95.0, memory=60.0)
        initial_metric = 95.0
        error_log = None
    else:
        raise ValueError(f"Unknown scenario '{scenario}'. Allowed: high-cpu, high-memory, application-failure, recovery-failure")

    # 2. Module 1: Observe & Module 2: Detect
    metrics = collect_system_metrics()
    incident = detect_incidents(metrics, sim_error_log=error_log)

    if not incident:
        return {
            "success": False,
            "scenario": scenario,
            "message": "Incident could not be created (another active incident may already exist for this metric).",
            "incident_id": None
        }

    inc_id = incident["id"]

    # If full autonomous loop execution is requested:
    if auto_execute_loop and is_auto_remediation_enabled():
        # Step 3: Diagnose (RCA)
        rca_res = perform_rca(incident)
        
        # Step 4 & 5: Remediate (Runbook Execution)
        rem_res = execute_remediation(incident)
        
        # Step 6: Verify (Verification)
        is_failure = (scenario == "recovery-failure")
        ver_res = verify_recovery(inc_id, is_failure_scenario=is_failure)

        return {
            "success": True,
            "scenario": scenario,
            "message": f"Autonomous reliability loop executed for {inc_id}.",
            "incident_id": inc_id,
            "initial_metric_value": initial_metric,
            "rca": rca_res,
            "remediation": rem_res,
            "verification": ver_res
        }

    return {
        "success": True,
        "scenario": scenario,
        "message": f"Incident {inc_id} detected and queued for manual/autonomous action.",
        "incident_id": inc_id,
        "initial_metric_value": initial_metric
    }


def reset_simulation() -> Dict[str, str]:
    """Reset simulation telemetry and clear overrides."""
    clear_simulation_override()
    return {"status": "SUCCESS", "message": "Simulation cleared. Restored live hardware monitoring."}
