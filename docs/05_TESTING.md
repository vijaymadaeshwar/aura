# Test Strategy & Execution Report
## Project: AURA Mini — Autonomous Reliability Agent
**Document Version:** 1.0.0  
**Test Framework:** `pytest 9.1.1` (`anyio 4.14.2`, `httpx 0.28.1`)  
**Test Suite Files:** `backend/test_aura.py`, `backend/test_database_pg.py`  
**Database Tested:** PostgreSQL 16 / Connection Pooling & Schema Validators

---

## 1. Testing Strategy

The AURA Mini test suite validates every module of the reliability loop through automated unit, integration, and API tests.

```
+---------------------------------------------------------------------------------+
|                               TESTING PYRAMID                                   |
+---------------------------------------------------------------------------------+
|                                                                                 |
|      [REST API Integration Tests]  --> Verify FastAPI routes, schemas, codes.   |
|     [Closed-Loop Lifecycle Tests]  --> Verify Observe -> Detect -> Remediate    |
|                                        -> Verify -> Resolve / Escalate.         |
|    [PostgreSQL Layer Unit Tests]   --> Verify DDL schemas, models & connection  |
|                                        error reporting.                         |
|    [Deterministic Engine Tests]    --> Verify RCA rules & Runbook catalog.      |
|    [Hardware Telemetry Unit Tests] --> Verify psutil sampling & safety bounds.  |
|                                                                                 |
+---------------------------------------------------------------------------------+
```

### Key Verification Principles
1. **Isolated Database Transactions:** Tests run inside a transactional test fixture that cleans `incidents`, `incident_events`, and `recovery_actions` tables and clears active simulation overlays before and after each test.
2. **Deterministic Verification:** Tests evaluate actual before-and-after values to verify that recovery transitions occur only when the metric drops strictly below the threshold.
3. **Escalation Path Validation:** Tests deliberately simulate post-remediation failures to prove that the agent detects failed recovery and logs an `ESCALATED` event rather than falsely declaring success.
4. **PostgreSQL Independence Check:** Tests verify that when PostgreSQL credentials or connection parameters are invalid, the system raises a clear `DatabaseConnectionError` rather than silently falling back to a local SQLite database.

---

## 2. Test Environment

| Component | Specification / Version |
| :--- | :--- |
| **Operating System** | Windows 11 (win32) |
| **Python Runtime** | Python `3.11.9` |
| **Backend Framework** | FastAPI `0.139.x` / Starlette |
| **Database Engine** | **PostgreSQL 16** |
| **Database Drivers** | `psycopg2-binary 2.9.13`, `psycopg 3.3.6`, `SQLAlchemy 2.0.51` |
| **Migrations** | `Alembic 1.20.0` |
| **Test Runner** | `pytest 9.1.1` with `pluggy 1.6.0` |
| **HTTP Client Library** | `httpx 0.28.1` (via FastAPI `TestClient`) |
| **Frontend Framework** | React `18.3.1`, TypeScript `5.7.2`, Vite `6.0.7` |

---

## 3. Functional & PostgreSQL Test Cases

| Test ID | Test Function | Test File | Description / Input | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | `test_telemetry_collection` | `test_aura.py` | Live host environment sampling via `collect_system_metrics()` | Returns dictionary with `cpu`, `memory`, `disk`, `network_mb_s`, `status`; all numeric metrics $\ge 0.0$. | **`PASS`** |
| **TC-02** | `test_detection_thresholds` | `test_aura.py` | 1. Baseline metrics ($\text{CPU}=35\%$).<br/>2. Elevated metrics ($\text{CPU}=94\%$). | 1. No incident created (`None`).<br/>2. Incident created with type `HIGH CPU`, severity `CRITICAL`. | **`PASS`** |
| **TC-03** | `test_rca_engine` | `test_aura.py` | High CPU incident ($94.0\%$) passed to `perform_rca()` | Diagnoses `root_cause` containing `"CPU-intensive"`, `confidence >= 90%`, recommends `RB-CPU-01`. | **`PASS`** |
| **TC-04** | `test_runbook_engine` | `test_aura.py` | Incident with `metric="cpu"` queried against runbook catalog | Catalog contains $\ge 4$ runbooks; maps CPU incident to `RB-CPU-01` (*"High CPU Recovery"*). | **`PASS`** |
| **TC-05** | `test_remediation_and_verification_loop` | `test_aura.py` | Simulated High CPU incident ($94.0\%$) through full autonomous remediation and verification | Incident moves `DETECTED` $\to$ `INVESTIGATING` $\to$ `REMEDIATING` $\to$ `VERIFYING` $\to$ `RESOLVED`. After-value drops $< 80\%$. | **`PASS`** |
| **TC-06** | `test_verification_failure_and_escalation` | `test_aura.py` | Simulated recovery failure scenario ($95.0\%$ CPU where post-check remains at $91.5\%$) | Post-check fails ($91.5\% \ge 80\%$); incident marked `FAILED`; `ESCALATED` event recorded in timeline. | **`PASS`** |
| **TC-07** | `test_rest_apis` | `test_aura.py` | FastAPI `TestClient` invoking `/api/metrics/health`, `/api/metrics/current`, `/api/runbooks` | Endpoints return HTTP 200 with schema-conformant JSON payloads. | **`PASS`** |
| **TC-08** | `test_database_connection_reporting` | `test_aura.py` | Database parameter parser test | Validates PostgreSQL connection parameters are configured without SQLite references. | **`PASS`** |
| **TC-09** | `test_postgres_config_parsing` | `test_database_pg.py` | Environment variable parsing | `get_db_params()` correctly parses database name, user, host, port. | **`PASS`** |
| **TC-10** | `test_sqlalchemy_postgresql_models` | `test_database_pg.py` | SQLAlchemy declarative model schema inspection | Validates all 5 tables (`incidents`, `incident_events`, `recovery_actions`, `telemetry_history`, `system_settings`), foreign keys with `ON DELETE CASCADE`. | **`PASS`** |
| **TC-11** | `test_database_connection_error_on_invalid_host` | `test_database_pg.py` | Unreachable PostgreSQL host connection test | Throws explicit `DatabaseConnectionError` rather than silently creating an in-memory database. | **`PASS`** |

---

## 4. API Endpoint Test Verification

| Endpoint | Method | Test Input / Payload | Expected Code | Actual Code | Verification Check | Status |
| :--- | :---: | :--- | :---: | :---: | :--- | :---: |
| `/api/metrics/health` | `GET` | None | `200` | `200` | `"status"` field present in JSON response. | **`PASS`** |
| `/api/metrics/current` | `GET` | None | `200` | `200` | `"cpu"`, `"memory"`, `"disk"` fields present and non-null. | **`PASS`** |
| `/api/runbooks` | `GET` | None | `200` | `200` | Array length $\ge 4$; contains `RB-CPU-01`. | **`PASS`** |
| `/api/incidents/INVALID-99` | `GET` | Non-existent incident ID | `404` | `404` | Returns `{"detail": "Incident INVALID-99 not found."}`. | **`PASS`** |
| `/api/simulate/scenario/xyz` | `POST` | Unsupported scenario string | `400` | `400` | Returns error detail identifying unsupported scenario. | **`PASS`** |

---

## 5. PostgreSQL Database Verification Summary

```
============================= test session starts =============================
platform win32 -- Python 3.11.9, pytest-9.1.1, pluggy-1.6.0
rootdir: D:\AURA_MINI V2
plugins: anyio-4.14.2
collected 3 items

backend/test_database_pg.py::test_postgres_config_parsing PASSED         [ 33%]
backend/test_database_pg.py::test_sqlalchemy_postgresql_models PASSED    [ 66%]
backend/test_database_pg.py::test_database_connection_error_on_invalid_host PASSED [100%]

============================== 3 passed in 4.36s ==============================
```
