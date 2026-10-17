"""
AURA MINI - Runbook Engine (Module 4: Runbook Engine)
Defines catalog of executable recovery runbooks and maps incidents to the optimal runbook.
"""

from typing import Dict, Any, List, Optional
from utils.logger import log_event

# Predefined standard reliability runbooks
RUNBOOK_CATALOG: Dict[str, Dict[str, Any]] = {
    "RB-CPU-01": {
        "id": "RB-CPU-01",
        "name": "High CPU Recovery",
        "description": "Isolates and restarts CPU-intensive worker processes, rebalancing thread concurrency.",
        "trigger": "CPU utilization > 80%",
        "preconditions": "Process PID identified; CPU remained above threshold for detection window.",
        "action": "Restart CPU-intensive worker process & throttle concurrent tasks",
        "verification_condition": "Post-restart CPU utilization < 80%",
        "success_condition": "CPU drops below threshold into healthy operating range (< 80%)",
        "failure_condition": "CPU remains above threshold (>= 80%) after remediation"
    },
    "RB-MEM-02": {
        "id": "RB-MEM-02",
        "name": "High Memory Recovery",
        "description": "Purges stale query cache buffers and recycles worker memory heap to eliminate leaks.",
        "trigger": "Memory utilization > 85%",
        "preconditions": "Memory buffer saturation detected; system swap engaged.",
        "action": "Flush in-memory cache buffer & restart application memory pool",
        "verification_condition": "Post-remediation memory utilization < 85%",
        "success_condition": "Memory drops below threshold (< 85%)",
        "failure_condition": "Memory remains above threshold (>= 85%)"
    },
    "RB-APP-03": {
        "id": "RB-APP-03",
        "name": "Application Failure Recovery",
        "description": "Recycles unresponsive application service, purges deadlocked sessions, and reconnects DB pool.",
        "trigger": "Application health check failure (HTTP 500 / DB connection timeout)",
        "preconditions": "Endpoint status DOWN or fatal error log detected.",
        "action": "Restart application service & re-initialize database connection pool",
        "verification_condition": "Health check endpoint returns HTTP 200 OK",
        "success_condition": "Service endpoint responds 200 OK with < 200ms latency",
        "failure_condition": "Health check fails or socket connection refused"
    },
    "RB-DISK-04": {
        "id": "RB-DISK-04",
        "name": "Disk Pressure Recovery",
        "description": "Purges temporary scratch files and compresses rotated debug log archives to reclaim storage.",
        "trigger": "Disk utilization > 90%",
        "preconditions": "Temporary log partition exceeds storage threshold.",
        "action": "Purge temporary cache directories & compress rotated log archives",
        "verification_condition": "Post-cleanup disk utilization < 90%",
        "success_condition": "Disk utilization drops below threshold (< 90%)",
        "failure_condition": "Disk utilization remains >= 90%"
    }
}


def get_all_runbooks() -> List[Dict[str, Any]]:
    """Return all predefined runbooks."""
    return list(RUNBOOK_CATALOG.values())


def get_runbook_by_id(runbook_id: str) -> Optional[Dict[str, Any]]:
    """Look up runbook by its ID."""
    return RUNBOOK_CATALOG.get(runbook_id)


def select_runbook_for_incident(incident: Dict[str, Any]) -> Dict[str, Any]:
    """Select the best matching runbook based on incident type and metric."""
    metric = incident["metric"]
    incident_type = incident["type"]

    if metric == "cpu" or "CPU" in incident_type:
        rb_id = "RB-CPU-01"
    elif metric == "memory" or "MEMORY" in incident_type:
        rb_id = "RB-MEM-02"
    elif metric == "disk" or "DISK" in incident_type:
        rb_id = "RB-DISK-04"
    elif metric == "app_health" or "APPLICATION" in incident_type:
        rb_id = "RB-APP-03"
    else:
        rb_id = "RB-CPU-01"

    runbook = RUNBOOK_CATALOG[rb_id]
    log_event("INFO", "RUNBOOK_ENGINE", f"Selected runbook {rb_id} ('{runbook['name']}') for incident {incident['id']}")
    return runbook
