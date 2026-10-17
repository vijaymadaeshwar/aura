# Software Requirements Specification (SRS)
## Project: AURA Mini — Autonomous Reliability Agent
**Document Version:** 1.0.0  
**Status:** Implemented & Verified  
**Target Audience:** Software Engineering Evaluation, Technical Placement Interviews

---

## 1. Introduction

### 1.1 Purpose
The purpose of **AURA Mini** is to provide an autonomous, closed-loop reliability agent that monitors local system health, detects abnormal threshold violations, diagnoses probable root causes using deterministic rules, executes predefined remediation runbooks, and verifies system recovery through post-remediation telemetry re-measurement.

This document defines the functional and non-functional requirements implemented in the AURA Mini software system.

### 1.2 Scope
AURA Mini encompasses:
- Real-time host telemetry collection via standard operating system performance counters.
- Anomaly and threshold breach detection with severity classification.
- Transparent, deterministic Root Cause Analysis (RCA) with confidence scoring and evidence tracking.
- Runbook catalog management and incident-to-runbook mapping.
- Automated runbook execution with state transitions (`DETECTED` $\to$ `INVESTIGATING` $\to$ `REMEDIATING` $\to$ `VERIFYING` $\to$ `RESOLVED` / `FAILED`).
- Closed-loop verification comparing post-remediation metrics against safety thresholds.
- Autonomous escalation handling when recovery verification fails.
- Incident audit history, event timeline streaming, and real-time frontend visualization.
- Safe, non-destructive incident simulation for testing and demonstrations.

### 1.3 Intended Users
- **Software Engineers & Reviewers:** Reviewing architectural modularity, API design, database integrity, and test coverage.
- **System Administrators & SREs:** Evaluating automated incident mitigation patterns and deterministic runbook execution.
- **Students & Learners:** Studying the closed-loop reliability automation pattern ($\text{Observe} \to \text{Detect} \to \text{Diagnose} \to \text{Remediate} \to \text{Verify}$).

---

## 2. System Overview

AURA Mini operates as a self-contained, event-driven reliability loop:

```
+-----------------------------------------------------------------------------------+
|                               SYSTEM OVERVIEW                                     |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|    INPUTS                                                                         |
|    - Host Telemetry (CPU %, RAM %, Disk %, Network MB/s, Uptime) via psutil       |
|    - Configurable Threshold Settings (CPU, Memory, Disk, Auto-Remediation Flag)   |
|    - Simulation Triggers (High CPU, High RAM, App Failure, Recovery Failure)      |
|                                                                                   |
|    PROCESSING                                                                     |
|    1. Observability: Sample telemetry every 2-3 seconds; keep rolling window.    |
|    2. Detection: Evaluate current metrics against configured thresholds.         |
|    3. Diagnosis (RCA): Map anomalous metric to root cause, evidence & confidence. |
|    4. Remediation: Select and execute mapped runbook action.                     |
|    5. Verification: Re-measure telemetry; classify as RESOLVED or FAILED.        |
|                                                                                   |
|    OUTPUTS                                                                        |
|    - Persistent Incidents Record (SQLite database)                               |
|    - Granular Incident Event Timeline                                             |
|    - Recovery Action Audit Log (before/after values, timestamps)                 |
|    - Real-Time Reactive Dashboard (React SPA + Recharts)                          |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 3. Functional Requirements

### 3.1 Module 1: Observability & Telemetry Collection

| Requirement ID | Requirement Description | Implementation Status |
| :--- | :--- | :--- |
| **FR-01** | The system shall sample host hardware metrics (CPU utilization %, RAM utilization %, Disk utilization %, Network transfer rate in MB/s, and System Uptime) using `psutil`. | **Implemented** (`services/telemetry.py`) |
| **FR-02** | The system shall maintain a sliding window of historical telemetry snapshots in the SQLite database (retaining the most recent 100 snapshots) for real-time frontend chart rendering. | **Implemented** (`services/telemetry.py`) |
| **FR-03** | The system shall compute overall system health status (`HEALTHY`, `WARNING`, `CRITICAL`) dynamically based on metric severity thresholds. | **Implemented** (`services/telemetry.py`) |

### 3.2 Module 2: Anomaly & Incident Detection

| Requirement ID | Requirement Description | Implementation Status |
| :--- | :--- | :--- |
| **FR-04** | The system shall compare current telemetry against configurable thresholds: CPU (default: $80\%$), RAM (default: $85\%$), Disk (default: $90\%$). | **Implemented** (`services/detector.py`) |
| **FR-05** | The system shall assign severity tiers to detected anomalies: `CRITICAL` (e.g., CPU $\ge 90\%$, RAM $\ge 92\%$, Disk $\ge 95\%$, App DOWN) or `HIGH` (above threshold but below critical boundary). | **Implemented** (`services/detector.py`) |
| **FR-06** | The system shall generate a unique incident identifier (`INC-001`, `INC-002`, etc.) upon detecting an anomaly and record the initial incident status as `DETECTED`. | **Implemented** (`services/detector.py`) |
| **FR-07** | The system shall prevent duplicate incident creation if an active, unresolved incident already exists for that specific metric. | **Implemented** (`services/detector.py`) |

### 3.3 Module 3: Root Cause Analysis (RCA)

| Requirement ID | Requirement Description | Implementation Status |
| :--- | :--- | :--- |
| **FR-08** | The system shall evaluate the anomalous incident metric, magnitude, and error context using deterministic rule sets. | **Implemented** (`services/rca.py`) |
| **FR-09** | The system shall produce a structured diagnosis comprising: Probable Root Cause, Diagnostic Evidence, Confidence Score ($80\% - 96\%$), and Recommended Runbook Action. | **Implemented** (`services/rca.py`) |
| **FR-10** | The system shall transition the incident status to `INVESTIGATING` and append an `RCA_COMPLETED` event to the incident timeline. | **Implemented** (`services/rca.py`) |

### 3.4 Module 4 & 5: Runbook Catalog & Automated Remediation

| Requirement ID | Requirement Description | Implementation Status |
| :--- | :--- | :--- |
| **FR-11** | The system shall maintain a predefined catalog of reliability runbooks: `RB-CPU-01` (High CPU Recovery), `RB-MEM-02` (High Memory Recovery), `RB-APP-03` (Application Failure Recovery), and `RB-DISK-04` (Disk Pressure Recovery). | **Implemented** (`services/runbook.py`) |
| **FR-12** | The system shall automatically select the matching runbook based on the incident metric and type. | **Implemented** (`services/runbook.py`) |
| **FR-13** | The system shall execute the selected runbook action, transition the incident status to `REMEDIATING`, and log a new record in `recovery_actions` capturing `before_value` and start timestamp. | **Implemented** (`services/remediation.py`) |
| **FR-14** | Upon completing action execution, the system shall transition the incident status to `VERIFYING` and record a `REMEDIATION_FINISHED` event. | **Implemented** (`services/remediation.py`) |

### 3.5 Module 6: Closed-Loop Recovery Verification

| Requirement ID | Requirement Description | Implementation Status |
| :--- | :--- | :--- |
| **FR-15** | The system shall re-measure the target system metric post-remediation and record the `after_value`. | **Implemented** (`services/verification.py`) |
| **FR-16** | If `after_value < threshold`, the system shall update incident status to `RESOLVED`, mark the recovery action as `SUCCESSFUL`, set `resolved_at`, and log `VERIFICATION_PASSED`. | **Implemented** (`services/verification.py`) |
| **FR-17** | If `after_value >= threshold`, the system shall update incident status to `FAILED`, mark the recovery action as `FAILED`, log `VERIFICATION_FAILED`, and create an `ESCALATED` event notifying human on-call engineers. | **Implemented** (`services/verification.py`) |

### 3.6 Module 7: Simulation, Settings & User Interface

| Requirement ID | Requirement Description | Implementation Status |
| :--- | :--- | :--- |
| **FR-18** | The system shall provide 4 non-destructive simulation scenarios: `high-cpu`, `high-memory`, `application-failure`, and `recovery-failure`, plus a reset endpoint (`/api/simulate/reset`). | **Implemented** (`services/simulator.py`) |
| **FR-19** | The system shall allow reading and updating detection thresholds and toggling the `auto_remediation_enabled` flag via REST API (`/api/settings`). | **Implemented** (`routers/settings.py`) |
| **FR-20** | The system shall provide an endpoint to clear incident history (`DELETE /api/incidents/clear`) to enable clean demonstration runs. | **Implemented** (`routers/incidents.py`) |
| **FR-21** | The system shall provide a Single Page Application (SPA) frontend with real-time metric cards, sliding charts, 5-stage loop banner, incident tables, timeline modal, and simulator controls. | **Implemented** (`frontend/src/`) |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **Telemetry Collection Latency:** Host sampling via `psutil` shall complete in $< 50\text{ ms}$.
- **API Response Time:** REST API endpoints shall respond in $< 100\text{ ms}$ under local execution.
- **Frontend Refresh Cadence:** The frontend client shall poll the telemetry API every $2\text{ seconds}$ without UI stutter or memory accumulation.

### 4.2 Reliability & Data Integrity
- **ACID Persistence:** PostgreSQL relational database initialized with connection pooling (`ThreadedConnectionPool`), foreign key constraints (`ON DELETE CASCADE`), indexes, and transactional commit/rollback management.
- **Safe Fallbacks:** Telemetry collection functions shall handle OS counter exceptions gracefully with fallback baselines to prevent service crashes.

### 4.3 Usability & Explainability
- **Interview-Ready Transparency:** Every incident shall expose its full diagnostic chain: Trigger Metric $\to$ Threshold Breach $\to$ RCA Root Cause $\to$ Confidence Score $\to$ Selected Runbook $\to$ Before/After Verification $\to$ Final State.
- **Clean Visual Hierarchy:** Dark-mode SRE aesthetic (`#0B1120`, `#111827`) with color-coded status badges (`HEALTHY` = Green, `WARNING` = Yellow, `CRITICAL` = Red, `RESOLVED` = Emerald, `FAILED/ESCALATED` = Rose).

### 4.4 Maintainability
- **Separation of Concerns:** Clear layer separation across Routers (`routers/`), Business Logic (`services/`), Data Models (`schemas.py`, `models.py`), Persistence (`database.py`, `config.py`), and Logging (`utils/logger.py`).
- **Standardized Type Contracts:** Pydantic models for backend request/response validation; TypeScript interfaces for frontend state management; SQLAlchemy models for migrations.

### 4.5 Security
- **Localhost Bound:** Default deployment is bound to local host interfaces (`127.0.0.1` / `0.0.0.0:8000`).
- **Non-Destructive Simulation:** Simulation scenarios utilize an in-memory overlay without altering actual system registry, processes, or disk partitions.
- **Input Validation:** Strict Pydantic parsing rejects invalid payloads on threshold and configuration update endpoints.

---

## 5. Constraints

- **Single Node Scope:** Telemetry and actions monitor and target the single local machine running the agent.
- **Relational Database:** Uses PostgreSQL 16 accessed via standard environment variables and connection pooling.
- **Rule-Based RCA:** Diagnostic logic uses deterministic heuristic rules rather than dynamic machine learning models.
- **Synchronous Runbook Simulation:** Remediation actions simulate execution using non-destructive sleep pauses and overlay updates.

---

## 6. Assumptions

- Python 3.10+ and Node.js 18+ are available in the host environment.
- The operating system grants standard user permissions to read performance counters via `psutil`.
- The browser executing the frontend supports modern ECMAScript and CSS flex/grid standards.

---

## 7. Out of Scope (Current Version)

The following capabilities are explicitly outside the scope of AURA Mini v1.0.0 and labeled as **Future Enhancements**:

- Multi-tenant user authentication and Role-Based Access Control (RBAC) with JWT tokens.
- Distributed metric ingestion agents (e.g., Prometheus / OpenTelemetry collectors).
- Machine learning anomaly forecasting (e.g., Prophet, LSTM time-series models).
- LLM-assisted unstructured log root cause analysis.
- Remote multi-node SSH or Kubernetes Pod eviction/restart execution.
- External webhook and pager integrations (e.g., PagerDuty, Slack, Opsgenie).
