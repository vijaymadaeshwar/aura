# REST API Documentation
## Project: AURA Mini — Autonomous Reliability Agent
**Document Version:** 1.0.0  
**Base URL:** `http://localhost:8000`  
**Content-Type:** `application/json`  
**Interactive Swagger UI:** `http://localhost:8000/docs`  
**OpenAPI Specification:** `http://localhost:8000/openapi.json`

---

## 1. Overview & Standard HTTP Status Codes

AURA Mini provides a modular RESTful API built on FastAPI.

| Status Code | Meaning | Usage in AURA Mini |
| :--- | :--- | :--- |
| **`200 OK`** | Success | Request succeeded and returned expected data. |
| **`400 Bad Request`** | Client Error | Invalid parameter or unsupported simulation scenario. |
| **`404 Not Found`** | Resource Missing | Requested incident ID or runbook ID does not exist in the database. |
| **`422 Unprocessable Entity`** | Validation Error | Request body payload failed Pydantic schema validation. |
| **`500 Internal Error`** | Server Error | Unhandled internal exception occurred. |

---

## 2. Metrics & Observability Endpoints

### 2.1 Get Current System Metrics
- **Method:** `GET`
- **Endpoint:** `/api/metrics/current`
- **Description:** Returns real-time host hardware metrics (or active simulation overlay) and health status.
- **Query Parameters:** None
- **Response (`200 OK`):**
```json
{
  "cpu": 34.5,
  "memory": 62.1,
  "disk": 48.0,
  "network_mb_s": 1.25,
  "uptime_seconds": 345600.0,
  "uptime_formatted": "4d 0h 0m",
  "status": "HEALTHY",
  "timestamp": "14:23:05",
  "active_incidents_count": 0,
  "is_simulated": false
}
```

### 2.2 Get Historical Telemetry Snapshots
- **Method:** `GET`
- **Endpoint:** `/api/metrics/history`
- **Description:** Retrieves recent telemetry data points for real-time frontend line charts.
- **Query Parameters:**
  - `limit` (optional, integer, default: `30`): Number of snapshots to return.
- **Response (`200 OK`):**
```json
[
  {
    "id": 101,
    "cpu": 32.1,
    "memory": 61.5,
    "disk": 48.0,
    "network_mb_s": 0.85,
    "timestamp": "14:22:55"
  },
  {
    "id": 102,
    "cpu": 34.5,
    "memory": 62.1,
    "disk": 48.0,
    "network_mb_s": 1.25,
    "timestamp": "14:23:05"
  }
]
```

### 2.3 Get Health Summary
- **Method:** `GET`
- **Endpoint:** `/api/metrics/health`
- **Description:** Returns a quick observability health summary of the agent.
- **Response (`200 OK`):**
```json
{
  "status": "HEALTHY",
  "uptime": "4d 0h 0m",
  "active_incidents": 0,
  "is_simulated": false,
  "timestamp": "14:23:05"
}
```

---

## 3. Incidents Endpoints

### 3.1 List Incidents
- **Method:** `GET`
- **Endpoint:** `/api/incidents`
- **Description:** Retrieves all incidents sorted by creation time descending.
- **Query Parameters:**
  - `status` (optional, string): Filter by status (`DETECTED`, `INVESTIGATING`, `REMEDIATING`, `VERIFYING`, `RESOLVED`, `FAILED`).
  - `limit` (optional, integer, default: `50`): Max records to return.
- **Response (`200 OK`):**
```json
[
  {
    "id": "INC-001",
    "type": "HIGH CPU",
    "severity": "CRITICAL",
    "status": "RESOLVED",
    "metric": "cpu",
    "current_value": 94.2,
    "threshold": 80.0,
    "root_cause": "CPU-intensive background worker process",
    "confidence": 94,
    "evidence": "CPU utilization remained at 94.2% (threshold: 80.0%). Sustained execution thread spike detected.",
    "recommended_action": "Execute Runbook RB-CPU-01: Restart CPU-intensive process and throttle worker pool.",
    "created_at": "14:20:10",
    "resolved_at": "14:20:12",
    "events": [
      {
        "id": 1,
        "incident_id": "INC-001",
        "event_type": "DETECTION",
        "message": "Incident detected: CPU utilization (94.2%) exceeded threshold (80.0%)",
        "timestamp": "14:20:10"
      },
      {
        "id": 2,
        "incident_id": "INC-001",
        "event_type": "RCA_COMPLETED",
        "message": "RCA completed: Probable cause 'CPU-intensive background worker process' with 94% confidence.",
        "timestamp": "14:20:10"
      }
    ],
    "recovery_action": {
      "id": 1,
      "incident_id": "INC-001",
      "runbook_id": "RB-CPU-01",
      "action_name": "Restart CPU-intensive worker process & throttle concurrent tasks",
      "status": "SUCCESSFUL",
      "before_value": 94.2,
      "after_value": 42.5,
      "started_at": "14:20:10",
      "completed_at": "14:20:11"
    }
  }
]
```

### 3.2 Get Incident by ID
- **Method:** `GET`
- **Endpoint:** `/api/incidents/{incident_id}`
- **Description:** Retrieves complete incident details, timeline events, and recovery actions.
- **Path Parameters:**
  - `incident_id` (string, required): e.g. `INC-001`.
- **Response (`200 OK`):** Full incident object as shown above.
- **Error Response (`404 Not Found`):**
```json
{
  "detail": "Incident INC-999 not found."
}
```

### 3.3 Get Incident Event Timeline
- **Method:** `GET`
- **Endpoint:** `/api/incidents/{incident_id}/events`
- **Description:** Retrieves chronological event stream for a specific incident.
- **Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "incident_id": "INC-001",
    "event_type": "DETECTION",
    "message": "Incident detected: CPU utilization (94.2%) exceeded threshold (80.0%)",
    "timestamp": "14:20:10"
  },
  {
    "id": 2,
    "incident_id": "INC-001",
    "event_type": "RCA_COMPLETED",
    "message": "RCA completed: Probable cause 'CPU-intensive background worker process' with 94% confidence.",
    "timestamp": "14:20:10"
  }
]
```

### 3.4 Trigger Root Cause Analysis Manually
- **Method:** `POST`
- **Endpoint:** `/api/incidents/{incident_id}/rca`
- **Description:** Triggers or re-evaluates RCA for an incident.
- **Response (`200 OK`):**
```json
{
  "incident_id": "INC-001",
  "root_cause": "CPU-intensive background worker process",
  "confidence": 94,
  "evidence": "CPU utilization remained at 94.2% (threshold: 80.0%). Sustained execution thread spike detected.",
  "recommended_action": "Execute Runbook RB-CPU-01: Restart CPU-intensive process and throttle worker pool."
}
```

### 3.5 Clear Incident History
- **Method:** `DELETE`
- **Endpoint:** `/api/incidents/clear`
- **Description:** Wipes all incidents, timeline events, and recovery actions for fresh demonstrations.
- **Response (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "message": "All incident records cleared."
}
```

---

## 4. Autonomous Recovery Endpoints

### 4.1 Get Active Remediations
- **Method:** `GET`
- **Endpoint:** `/api/recovery/active`
- **Description:** Retrieves any remediation actions currently executing or pending verification.
- **Response (`200 OK`):** Array of active recovery records.

### 4.2 Get Recovery Audit History
- **Method:** `GET`
- **Endpoint:** `/api/recovery/history`
- **Description:** Retrieves audit log of all executed remediations and verification results.
- **Query Parameters:**
  - `limit` (optional, integer, default: `50`): Max records.
- **Response (`200 OK`):**
```json
[
  {
    "id": 1,
    "incident_id": "INC-001",
    "runbook_id": "RB-CPU-01",
    "action_name": "Restart CPU-intensive worker process & throttle concurrent tasks",
    "status": "SUCCESSFUL",
    "before_value": 94.2,
    "after_value": 42.5,
    "started_at": "14:20:10",
    "completed_at": "14:20:11"
  }
]
```

### 4.3 Trigger Remediation for Incident
- **Method:** `POST`
- **Endpoint:** `/api/recovery/incidents/{incident_id}/remediate`
- **Description:** Executes the mapped runbook remediation action for an incident.
- **Response (`200 OK`):**
```json
{
  "action_id": 1,
  "incident_id": "INC-001",
  "runbook": {
    "id": "RB-CPU-01",
    "name": "High CPU Recovery",
    "action": "Restart CPU-intensive worker process & throttle concurrent tasks"
  },
  "status": "COMPLETED",
  "started_at": "14:20:10",
  "completed_at": "14:20:11"
}
```

### 4.4 Trigger Verification for Incident
- **Method:** `POST`
- **Endpoint:** `/api/recovery/incidents/{incident_id}/verify`
- **Description:** Executes post-remediation verification measurement on an incident.
- **Query Parameters:**
  - `simulate_failure` (optional, boolean, default: `false`): Force a failed verification to demonstrate escalation.
- **Response (`200 OK` - Success Scenario):**
```json
{
  "incident_id": "INC-001",
  "is_recovered": true,
  "status": "RESOLVED",
  "metric": "cpu",
  "threshold": 80.0,
  "before_value": 94.2,
  "after_value": 42.5,
  "message": "✓ RECOVERY SUCCESSFUL: CPU reduced from 94.2% → 42.5% (threshold: 80.0%).",
  "timestamp": "14:20:12"
}
```
- **Response (`200 OK` - Failure & Escalation Scenario):**
```json
{
  "incident_id": "INC-002",
  "is_recovered": false,
  "status": "FAILED",
  "metric": "cpu",
  "threshold": 80.0,
  "before_value": 95.0,
  "after_value": 91.5,
  "message": "✗ RECOVERY FAILED: CPU measured at 91.5%, still exceeding threshold of 80.0%.",
  "timestamp": "14:22:00"
}
```

---

## 5. Runbooks Endpoints

### 5.1 List All Runbooks
- **Method:** `GET`
- **Endpoint:** `/api/runbooks`
- **Description:** Retrieves full catalog of available reliability runbooks.
- **Response (`200 OK`):**
```json
[
  {
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
  {
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
  {
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
  {
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
]
```

### 5.2 Get Runbook by ID
- **Method:** `GET`
- **Endpoint:** `/api/runbooks/{runbook_id}`
- **Response (`200 OK`):** Specific runbook object.
- **Error Response (`404 Not Found`):** `{"detail": "Runbook RB-XYZ not found."}`

---

## 6. Incident Simulator Endpoints

### 6.1 Simulate High CPU
- **Method:** `POST`
- **Endpoint:** `/api/simulate/high-cpu`
- **Query Parameters:** `auto_execute` (boolean, default: `true`).
- **Response (`200 OK`):**
```json
{
  "success": true,
  "scenario": "high-cpu",
  "message": "Autonomous reliability loop executed for INC-001.",
  "incident_id": "INC-001",
  "initial_metric_value": 94.2,
  "rca": {
    "incident_id": "INC-001",
    "root_cause": "CPU-intensive background worker process",
    "confidence": 94
  },
  "remediation": {
    "status": "COMPLETED",
    "action_id": 1
  },
  "verification": {
    "is_recovered": true,
    "status": "RESOLVED",
    "before_value": 94.2,
    "after_value": 42.5
  }
}
```

### 6.2 Simulate High Memory
- **Method:** `POST`
- **Endpoint:** `/api/simulate/high-memory`
- **Query Parameters:** `auto_execute` (boolean, default: `true`).

### 6.3 Simulate Application Failure
- **Method:** `POST`
- **Endpoint:** `/api/simulate/application-failure`
- **Query Parameters:** `auto_execute` (boolean, default: `true`).

### 6.4 Simulate Recovery Failure (Escalation Demo)
- **Method:** `POST`
- **Endpoint:** `/api/simulate/recovery-failure`
- **Query Parameters:** `auto_execute` (boolean, default: `true`).

### 6.5 Generic Scenario Endpoint
- **Method:** `POST`
- **Endpoint:** `/api/simulate/scenario/{scenario}`
- **Path Parameters:** `scenario` (`high-cpu`, `high-memory`, `application-failure`, `recovery-failure`).
- **Error Response (`400 Bad Request`):**
```json
{
  "detail": "Unknown scenario 'invalid-name'. Allowed: high-cpu, high-memory, application-failure, recovery-failure"
}
```

### 6.6 Reset Simulation
- **Method:** `POST`
- **Endpoint:** `/api/simulate/reset`
- **Response (`200 OK`):**
```json
{
  "status": "SUCCESS",
  "message": "Simulation cleared. Restored live hardware monitoring."
}
```

---

## 7. Events & System Logs Endpoints

### 7.1 Get All Incident Events
- **Method:** `GET`
- **Endpoint:** `/api/events`
- **Query Parameters:** `limit` (integer, default: `50`).
- **Response (`200 OK`):** Array of all timeline events with joined incident type and severity.

### 7.2 Get System Runtime Logs
- **Method:** `GET`
- **Endpoint:** `/api/events/logs`
- **Query Parameters:** `limit` (integer, default: `50`).
- **Response (`200 OK`):**
```json
[
  {
    "timestamp": "14:20:10",
    "level": "WARNING",
    "source": "DETECTOR",
    "message": "Created incident INC-001: HIGH CPU (94.2%)"
  },
  {
    "timestamp": "14:20:10",
    "level": "INFO",
    "source": "RCA_ENGINE",
    "message": "Diagnosed INC-001: CPU-intensive background worker process (Confidence: 94%)"
  }
]
```

---

## 8. System Settings Endpoints

### 8.1 Get Current Settings
- **Method:** `GET`
- **Endpoint:** `/api/settings`
- **Response (`200 OK`):**
```json
{
  "cpu_threshold": 80.0,
  "memory_threshold": 85.0,
  "disk_threshold": 90.0,
  "auto_remediation_enabled": true,
  "polling_interval_sec": 3.0
}
```

### 8.2 Update Settings
- **Method:** `PUT`
- **Endpoint:** `/api/settings`
- **Request Body:**
```json
{
  "cpu_threshold": 75.0,
  "memory_threshold": 80.0,
  "disk_threshold": 85.0,
  "auto_remediation_enabled": true,
  "polling_interval_sec": 2.0
}
```
- **Response (`200 OK`):** Updated settings object.
