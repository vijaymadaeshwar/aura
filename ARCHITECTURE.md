# AURA MINI — System Architecture & Technical Specifications

This document outlines the architectural patterns, state machine transitions, telemetry pipelines, and deterministic reliability logic implemented in **AURA MINI**.

---

## 1. High-Level Architecture Diagram

```
+-------------------------------------------------------------------------------+
|                                FRONTEND LAYER                                 |
|  React 18 + TypeScript + Vite + Tailwind CSS + Lucide Icons + Recharts        |
|  ---------------------------------------------------------------------------  |
|  [Dashboard]  [System Health]  [Incidents]  [Recovery]  [Runbooks]  [Simulator]|
+---------------------------------------+---------------------------------------+
                                        | REST HTTP (Polling / Triggers)
                                        v
+-------------------------------------------------------------------------------+
|                            FASTAPI SERVICE LAYER                              |
|  ---------------------------------------------------------------------------  |
|  Routers:  /api/metrics   /api/incidents   /api/recovery   /api/simulate      |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                        AUTONOMOUS RELIABILITY ENGINE                          |
|                                                                               |
|  1. OBSERVABILITY (telemetry.py)                                              |
|     - Reads hardware metrics via psutil (CPU, Memory, Disk, Net, Uptime)      |
|     - Non-destructive simulation overlay injection                            |
|                                                                               |
|  2. INCIDENT DETECTION (detector.py)                                          |
|     - Dynamic threshold comparison (CPU > 80%, RAM > 85%, Disk > 90%)         |
|     - Deduplication & Severity assignment (LOW / MED / HIGH / CRITICAL)       |
|                                                                               |
|  3. ROOT CAUSE ANALYSIS (rca.py)                                              |
|     - Deterministic rule engine analyzing telemetry signatures & log context  |
|     - Generates Cause, Evidence, Confidence %, and Recommended Runbook        |
|                                                                               |
|  4. RUNBOOK ENGINE (runbook.py)                                               |
|     - Catalog of operational procedures (RB-CPU-01, RB-MEM-02, RB-APP-03)    |
|                                                                               |
|  5. AUTOMATED REMEDIATION (remediation.py)                                    |
|     - Executes runbook action & records execution audit timestamps            |
|                                                                               |
|  6. RECOVERY VERIFICATION (verification.py)                                   |
|     - Compares post-remediation metric with safety threshold                  |
|     - Before -> After Delta Evaluation:                                       |
|       * Recovered (e.g. 94% -> 43% <= 80%)  => RESOLVED                       |
|       * Failed    (e.g. 95% -> 91% > 80%)   => FAILED -> ESCALATE             |
+---------------------------------------+---------------------------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                       PERSISTENCE LAYER (PostgreSQL 16)                       |
|  ---------------------------------------------------------------------------  |
|  aura_db (Connection Pool + Alembic Migrations):                              |
|  - incidents            - incident_events (Timeline)                          |
|  - recovery_actions     - telemetry_history (Sliding Window)                  |
|  - system_settings                                                            |
+-------------------------------------------------------------------------------+
```

---

## 2. Incident Lifecycle State Machine

```
      +-------------+
      |  DETECTED   |  <--- Telemetry breach detected by detector.py
      +------+------+
             |
             v
      +-------------+
      |INVESTIGATING|  <--- RCA Engine evaluating metrics & logs
      +------+------+
             |
             v
      +-------------+
      | REMEDIATING |  <--- Executing recommended runbook action
      +------+------+
             |
             v
      +-------------+
      | VERIFYING   |  <--- Measuring post-remediation telemetry
      +------+------+
             |
     +-------+-------+
     |               |
[Delta <= Limit] [Delta > Limit]
     |               |
     v               v
+----------+   +-----------+
| RESOLVED |   |  FAILED   |
+----------+   +-----+-----+
                     |
                     v
               +-----------+
               | ESCALATED |  <--- Alert Tier-2 Human SRE
               +-----------+
```

---

## 3. PostgreSQL Database Schema Reference

```
+-----------------------------------------------------------------------------+
|                                 incidents                                   |
+-----------------------------------------------------------------------------+
| id (PK)             VARCHAR(64)   Unique ID (e.g. INC-001)                  |
| type                VARCHAR(64)   Category (HIGH CPU, HIGH MEMORY, etc.)    |
| severity            VARCHAR(32)   CRITICAL / HIGH / MEDIUM / LOW            |
| status              VARCHAR(32)   DETECTED / INVESTIGATING / REMEDIATING /  |
|                                   VERIFYING / RESOLVED / FAILED             |
| metric              VARCHAR(64)   Trigger metric (cpu, memory, disk)        |
| current_value       FLOAT         Value at time of detection                |
| threshold           FLOAT         Threshold limit                           |
| root_cause          TEXT          Diagnosed root cause                      |
| confidence          INTEGER       RCA confidence percentage (80-96%)        |
| evidence            TEXT          Evidence telemetry string                 |
| recommended_action  TEXT          Suggested recovery runbook                |
| created_at          VARCHAR(64)   Timestamp string                          |
| resolved_at         VARCHAR(64)   Resolution timestamp string               |
+-----------------------------------------------------------------------------+
                                       |
                   +-------------------+-------------------+
                   | 1:N                                   | 1:N
                   v                                       v
+------------------------------------+  +-------------------------------------+
|          incident_events           |  |          recovery_actions           |
+------------------------------------+  +-------------------------------------+
| id (PK)       SERIAL               |  | id (PK)       SERIAL                |
| incident_id   VARCHAR(64) (FK)     |  | incident_id   VARCHAR(64) (FK)      |
| event_type    VARCHAR(64)          |  | runbook_id    VARCHAR(64)           |
| message       TEXT                 |  | action_name   TEXT                  |
| timestamp     VARCHAR(64)          |  | status        VARCHAR(32)           |
+------------------------------------+  | before_value  FLOAT                 |
                                        | after_value   FLOAT                 |
                                        | started_at    VARCHAR(64)           |
                                        | completed_at  VARCHAR(64)           |
                                        +-------------------------------------+
```

---

## 4. RCA Deterministic Diagnostic Rules Matrix

| Metric Breach | Diagnostic Signature | Probable Root Cause | Confidence | Recommended Runbook |
| :--- | :--- | :--- | :---: | :--- |
| `CPU > 80%` | High CPU spike, sustained thread execution | CPU-intensive background worker process | $94\%$ | `RB-CPU-01` (Worker Restart) |
| `RAM > 85%` | High memory utilization, swap active | Memory leak in query cache buffer | $91\%$ | `RB-MEM-02` (Cache Flush) |
| `Disk > 90%` | High disk utilization, debug logs filling | Log file volume exhaustion in temp partition | $96\%$ | `RB-DISK-04` (Log Compression) |
| `App Health` | HTTP 500 status / DB timeout logs | Database connection pool timeout | $89\%$ | `RB-APP-03` (Service Restart) |
