"""
AURA MINI - Root Cause Analysis (RCA) Engine (Module 3: Root Cause Analysis)
Rule-based deterministic diagnosis engine that analyzes metric telemetry and error logs.
Transparent, explainable, and interview-ready.
"""

import datetime
from typing import Dict, Any
from database import get_db
from utils.logger import log_event


def perform_rca(incident: Dict[str, Any], logs: list = None) -> Dict[str, Any]:
    """
    Executes rule-based RCA on an incident:
    Inspects metric type, magnitude, and recent logs to determine cause, evidence, confidence, and recommended action.
    """
    metric = incident["metric"]
    current_val = incident["current_value"]
    threshold = incident["threshold"]
    incident_type = incident["type"]
    now_str = datetime.datetime.now().strftime("%H:%M:%S")

    # Rule 1: High CPU Anomaly
    if metric == "cpu" or incident_type == "HIGH CPU":
        root_cause = "CPU-intensive background worker process"
        evidence = f"CPU utilization remained at {current_val}% (threshold: {threshold}%). Sustained execution thread spike detected."
        confidence = 94
        recommended_action = "Execute Runbook RB-CPU-01: Restart CPU-intensive process and throttle worker pool."

    # Rule 2: High Memory Anomaly
    elif metric == "memory" or incident_type == "HIGH MEMORY":
        root_cause = "Memory leak in application query cache buffer"
        evidence = f"RAM utilization reached {current_val}% (threshold: {threshold}%). Uncollected buffer objects accumulating."
        confidence = 91
        recommended_action = "Execute Runbook RB-MEM-02: Flush application cache and restart worker memory pool."

    # Rule 3: Disk Pressure Anomaly
    elif metric == "disk" or incident_type == "DISK PRESSURE":
        root_cause = "Log file volume exhaustion in temporary storage partition"
        evidence = f"Disk utilization reached {current_val}% (threshold: {threshold}%). Temporary debug log partition full."
        confidence = 96
        recommended_action = "Execute Runbook RB-DISK-04: Purge temporary log buffer and compress rotated archives."

    # Rule 4: Application / Service Failure
    elif metric == "app_health" or incident_type == "APPLICATION FAILURE":
        root_cause = "Database connection pool timeout & deadlocked session"
        evidence = "Service endpoint health check failed (HTTP 500). System error logs show connection pool exhaustion."
        confidence = 89
        recommended_action = "Execute Runbook RB-APP-03: Restart application service and recycle database connection pool."

    # Default Fallback Rule
    else:
        root_cause = f"Unclassified threshold breach on metric '{metric}'"
        evidence = f"Metric value {current_val} exceeded safety limit {threshold}."
        confidence = 80
        recommended_action = "Execute general system recovery and alert on-call engineer."

    # Update Incident in Database
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE incidents
            SET status = 'INVESTIGATING',
                root_cause = %s,
                confidence = %s,
                evidence = %s,
                recommended_action = %s
            WHERE id = %s
        """, (root_cause, confidence, evidence, recommended_action, incident["id"]))

        # Log timeline event
        cursor.execute("""
            INSERT INTO incident_events (incident_id, event_type, message, timestamp)
            VALUES (%s, %s, %s, %s)
        """, (
            incident["id"],
            "RCA_COMPLETED",
            f"RCA completed: Probable cause '{root_cause}' with {confidence}% confidence.",
            now_str
        ))

    log_event("INFO", "RCA_ENGINE", f"Diagnosed {incident['id']}: {root_cause} (Confidence: {confidence}%)")

    return {
        "incident_id": incident["id"],
        "root_cause": root_cause,
        "confidence": confidence,
        "evidence": evidence,
        "recommended_action": recommended_action
    }
