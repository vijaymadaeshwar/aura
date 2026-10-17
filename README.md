# AURA — Autonomous Reliability Agent

> **Observe. Detect. Diagnose. Remediate. Verify.**

---

## 1. Project Overview

### What is AURA?
**AURA** is an enterprise-ready, closed-loop reliability agent designed to automate the complete incident lifecycle for modern distributed software systems.

### What Problem Does It Solve?
Traditional monitoring and observability tools (such as basic dashboards or metric scrapers) only notify engineers that a system is unhealthy. Once an alert triggers, human engineers must manually investigate logs, determine root causes, locate the correct runbook, execute remediation steps, and verify whether the system actually recovered.

### Why is it Needed?
AURA closes this operational loop. Instead of stopping at notification, it executes a deterministic, five-stage reliability automation pipeline:

$$\text{OBSERVE} \longrightarrow \text{DETECT} \longrightarrow \text{DIAGNOSE} \longrightarrow \text{REMEDIATE} \longrightarrow \text{VERIFY}$$

> **Important Scope Clarification:** AURA does **not** replace human software engineers or SREs. It automates repetitive, well-defined recovery procedures and immediately escalates to human on-call engineers when an automated recovery attempt fails verification.

---

## 2. Problem Statement

Modern software systems generate continuous streams of metrics, logs, and health signals:

1. **Detection Delay:** Manually monitoring metric dashboards or reacting to delayed alerts increases Mean Time to Detect (MTTD).
2. **Repetitive Investigation:** Common infrastructure failures (such as runaway processes, memory leaks, disk storage exhaustion, or deadlocked connection pools) exhibit recurring symptom patterns.
3. **Repetitive Remediation:** Engineers repeatedly execute identical manual steps (restarting worker processes, clearing cache buffers, compressing rotated logs).
4. **Missing Verification:** Many automated scripts simply fire an action and assume success without re-measuring the system to verify that the metric actually returned below safety thresholds.

**AURA solves this by automating the entire reliability cycle with strict before-and-after verification backed by a relational PostgreSQL database.**

---

## 3. Key Features (Implemented & Verified)

* **Host Telemetry Collection:** Continuously measures CPU, Memory, Disk, Network transfer rate ($\text{MB/s}$), and System Uptime using Python's `psutil`.
* **Configurable Anomaly Detection:** Dynamically evaluates telemetry against user-configured thresholds with multi-tier severity ratings (`HIGH` vs `CRITICAL`).
* **Alert Storm Suppression:** Prevents duplicate incident creation if an active, unresolved incident already exists for that metric.
* **Deterministic Root Cause Analysis (RCA):** Diagnoses causes, produces diagnostic evidence strings, calculates confidence scores ($80\% - 96\%$), and recommends runbooks.
* **Predefined Runbook Catalog:** Includes standard recovery runbooks:
  * `RB-CPU-01`: High CPU Recovery (worker pool restart & throttling)
  * `RB-MEM-02`: High Memory Recovery (cache flush & memory pool recycling)
  * `RB-APP-03`: Application Failure Recovery (service recycling & DB pool reconnect)
  * `RB-DISK-04`: Disk Pressure Recovery (scratch buffer purge & archive compression)
* **Automated Remediation Execution:** Orchestrates runbook actions and updates lifecycle states in real time.
* **Closed-Loop Verification:** Re-measures telemetry post-action and compares `after_value` against threshold to verify true recovery.
* **Autonomous Escalation:** If verification detects that a metric remains above threshold ($91.5\% \ge 80\%$), the incident status transitions to `FAILED` and logs an `ESCALATED` event for human intervention.
* **PostgreSQL Relational Persistence:** Production-grade relational storage with connection pooling (`ThreadedConnectionPool`), real dictionary cursors, indexes, cascading foreign keys, and Alembic database migrations.
* **Granular Event Timeline:** Maintains an audit stream of every state transition (`DETECTION`, `RCA_COMPLETED`, `REMEDIATION_STARTED`, `REMEDIATION_FINISHED`, `VERIFICATION_PASSED`, `VERIFICATION_FAILED`, `ESCALATED`).
* **Interactive Incident Simulator:** Provides safe, non-destructive simulation triggers for 4 scenarios (`high-cpu`, `high-memory`, `application-failure`, `recovery-failure`) with 1-click reset.
* **Full-Featured SPA Dashboard:** Built with React 18, TypeScript, Tailwind CSS, Lucide icons, and Recharts historical telemetry charts.
* **Docker & Docker Compose:** Complete containerized multi-service deployment with PostgreSQL 16 and automated health checks.

---

## 4. Core Workflow

```
+-----------------------------------------------------------------------------------+
|                            THE 5-STAGE RELIABILITY LOOP                            |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  1. OBSERVE    --> Collect host telemetry via psutil (CPU, RAM, Disk, Net, Uptime)|
|  2. DETECT     --> Compare metrics to thresholds (CPU > 80%, RAM > 85%, Disk > 90%)|
|  3. DIAGNOSE   --> Deterministic RCA engine identifies probable cause & confidence |
|  4. REMEDIATE  --> Select and execute matched runbook action (e.g. RB-CPU-01)     |
|  5. VERIFY     --> Re-measure metric:                                             |
|                    - If metric < threshold  --> Incident RESOLVED (Recovered)     |
|                    - If metric >= threshold --> Incident FAILED (Auto-Escalated)  |
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

---

## 5. System Architecture

```mermaid
flowchart TD
    subgraph Frontend ["Frontend SPA (React 18 + TypeScript + Tailwind CSS)"]
        DASH["Dashboard & Charts (Recharts)"]
        INC_UI["Incident Table & Timeline Modal"]
        SIM_UI["Incident Simulator Controls"]
    end

    subgraph Backend ["Backend Application (FastAPI + Python 3.13)"]
        API["REST API Routers (/metrics, /incidents, /recovery, /runbooks, /simulate, /settings)"]
        TEL["Telemetry Collector (psutil)"]
        DET["Anomaly Detector"]
        RCA["RCA Engine (Rule-Based)"]
        RUN["Runbook Engine (Catalog)"]
        REM["Remediation Engine"]
        VER["Verification Engine"]
        SIM["Simulation Controller"]
    end

    subgraph Storage ["Relational Storage (PostgreSQL 16)"]
        DB[("PostgreSQL Database (aura_reliability_db)<br/>Connection Pool & Foreign Keys")]
    end

    Frontend <-->|HTTP / REST JSON| API
    API --> TEL
    API --> DET
    API --> RCA
    API --> RUN
    API --> REM
    API --> VER
    API --> SIM

    TEL --> DB
    DET --> DB
    RCA --> DB
    REM --> DB
    VER --> DB
```

---

## 6. Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React `18.3.1` | Declarative user interface |
| **Frontend Language** | TypeScript `5.7.2` | Static typing and interface contracts |
| **UI Styling** | Tailwind CSS `3.4.17` | Responsive dark-mode SRE design system |
| **UI Icons** | Lucide React `0.468.0` | SRE and telemetry iconography |
| **Data Visualization** | Recharts `2.15.0` | Real-time sliding telemetry line charts |
| **Frontend Tooling** | Vite `6.0.7` | Fast module bundler and dev server |
| **Backend Framework** | FastAPI `0.115.x` | High-performance asynchronous REST API |
| **Backend Language** | Python `3.11.9` | Backend logic and diagnostic algorithms |
| **Database** | **PostgreSQL 16** | Relational ACID storage with connection pooling |
| **DB Driver & ORM** | `psycopg2-binary`, `psycopg3`, `SQLAlchemy 2.0` | High-performance PostgreSQL drivers & ORM models |
| **Migrations** | `Alembic 1.20.0` | Declarative database schema migrations |
| **Hardware Telemetry** | `psutil 5.9.x` | Cross-platform host performance counters |
| **Data Validation** | Pydantic `2.6.x` | Strict request/response schema parsing |
| **Containerization** | Docker & Docker Compose | Multi-container PostgreSQL and app orchestration |
| **Testing Suite** | `pytest 9.1.1` & `httpx` | Automated closed-loop integration testing |

---

## 7. Project Structure

```
aura/
├── backend/
│   ├── main.py                  # FastAPI entry point & unified static SPA server
│   ├── config.py                # PostgreSQL environment variable configuration
│   ├── database.py              # PostgreSQL connection pool & table migrations
│   ├── models.py                # SQLAlchemy ORM declarative models
│   ├── schemas.py               # Pydantic data models & request/response schemas
│   ├── test_aura.py             # Pytest automated test suite
│   ├── test_database_pg.py      # PostgreSQL database layer unit tests
│   ├── requirements.txt         # Python dependencies (psycopg2, alembic, fastapi, etc.)
│   ├── Dockerfile               # Backend Dockerfile
│   ├── alembic.ini              # Alembic database migration config
│   ├── alembic/                 # Database migration scripts
│   │   ├── env.py               # Alembic environment runner
│   │   └── versions/            # Versioned migration scripts
│   ├── routers/                 # Modular API endpoints
│   │   ├── metrics.py           # /api/metrics endpoints
│   │   ├── incidents.py         # /api/incidents endpoints
│   │   ├── recovery.py          # /api/recovery endpoints
│   │   ├── runbooks.py          # /api/runbooks endpoints
│   │   ├── simulator.py         # /api/simulate endpoints
│   │   ├── events.py            # /api/events & logs endpoints
│   │   └── settings.py          # /api/settings endpoints
│   ├── services/                # Core business logic modules
│   │   ├── telemetry.py         # Module 1: Observability & psutil sampling
│   │   ├── detector.py          # Module 2: Anomaly & threshold detection
│   │   ├── rca.py               # Module 3: Rule-based Root Cause Analysis
│   │   ├── runbook.py           # Module 4: Runbook catalog & mapper
│   │   ├── remediation.py       # Module 5: Automated remediation runner
│   │   ├── verification.py      # Module 6: Closed-loop verification comparator
│   │   └── simulator.py         # Module 7: Non-destructive scenario controller
│   └── utils/
│       └── logger.py            # Circular buffer logging utility
├── frontend/
│   ├── index.html               # SPA HTML entry point
│   ├── package.json             # NPM package scripts and dependencies
│   ├── tsconfig.json            # TypeScript configuration
│   ├── tailwind.config.js       # Tailwind theme & color tokens
│   ├── vite.config.ts           # Vite build & proxy configuration
│   ├── dist/                    # Compiled production build
│   └── src/                     # React source components and pages
├── docs/                        # Complete Software Engineering Documentation
│   ├── 01_SRS.md                # Software Requirements Specification
│   ├── 02_SYSTEM_DESIGN.md      # Architecture, Component & Scalability Design
│   ├── 03_API_DOCUMENTATION.md  # Complete REST API reference
│   ├── 04_DATABASE_DESIGN.md    # PostgreSQL schemas, keys, constraints & ER diagrams
│   └── 05_TESTING.md            # Test strategy, execution logs & test cases
├── docker-compose.yml           # Multi-service Docker Compose definition (PostgreSQL + App)
├── Dockerfile                   # Multi-stage Dockerfile
├── .env.example                 # Environment configuration template
├── .env                         # Active environment configuration
├── start_aura.bat               # 1-Click Windows launch script
└── README.md                    # Project README
```

---

## 8. Database Configuration & Environment Variables

AURA reads PostgreSQL connection credentials from `.env` or system environment variables:

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_USER` | `aura_user` | PostgreSQL database user |
| `POSTGRES_PASSWORD` | `aura_password` | PostgreSQL database password |
| `POSTGRES_HOST` | `localhost` (or `postgres` in Docker) | PostgreSQL host address |
| `POSTGRES_PORT` | `5432` | PostgreSQL listening port |
| `POSTGRES_DB` | `aura_reliability_db` | Target PostgreSQL database name |
| `DATABASE_URL` | `postgresql://aura_user:aura_password@localhost:5432/aura_reliability_db` | Full standard connection URL |

---

## 9. Running with Docker Compose (Recommended)

To run the complete application stack with PostgreSQL 16:

```bash
# 1. Start PostgreSQL and AURA
docker compose up -d --build

# 2. View running containers and health status
docker compose ps

# 3. Open your browser:
# Web UI & Dashboard: http://localhost:8000
# Interactive Swagger UI: http://localhost:8000/docs
```

---

## 10. Running Locally for Development

### Prerequisites
* **Python 3.10+** (Tested on Python 3.11.9)
* **Node.js 18+** & **npm** (Tested on Node v22.10.x)
* **PostgreSQL 14+** (Running locally or via `docker run -d -p 5432:5432 -e POSTGRES_USER=aura_user -e POSTGRES_PASSWORD=aura_password -e POSTGRES_DB=aura_reliability_db postgres:16-alpine`)

### Step 1: Install Backend Dependencies
```powershell
cd backend
pip install -r requirements.txt
```

### Step 2: Run Database Migrations (Optional / Automatic)
The database schema initializes automatically on backend startup. Alternatively, run migrations using Alembic:
```powershell
cd backend
alembic upgrade head
```

### Step 3: Start Application
```powershell
cd backend
python main.py
```
* **Web UI & Dashboard:** [http://localhost:8000](http://localhost:8000)
* **Interactive Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 11. Running the Automated Test Suite

To run all unit, integration, and database tests:

```powershell
cd aura
python -m pytest backend/test_aura.py backend/test_database_pg.py -v
```

---

## 12. Interactive Demo Walkthrough (3–5 Minutes)

Follow these steps during a technical interview or live demonstration:

1. **Baseline Health Check:**
   - Open [http://localhost:8000](http://localhost:8000).
   - Point out the live telemetry cards (CPU, Memory, Disk, Network rate) polling the host operating system via `psutil`.
   - Show the 5-stage banner in the healthy steady state (`OBSERVE` active).
2. **Simulate an Incident (High CPU):**
   - Click **`Simulate High CPU`** in the Quick Simulator bar.
   - Observe the live metric spike to $94.2\%$.
3. **Observe Autonomous Closed-Loop Execution:**
   - Watch the 5-stage loop illuminate automatically:
     $$\text{OBSERVE} \longrightarrow \text{DETECT (94.2\% CPU)} \longrightarrow \text{DIAGNOSE (RCA: Worker process)} \longrightarrow \text{REMEDIATE (RB-CPU-01)} \longrightarrow \text{VERIFY (42.5\%)} \longrightarrow \text{RECOVERED}$$
4. **Inspect Deep Diagnostic Evidence:**
   - Navigate to the **Incidents** tab and open incident `INC-001`.
   - Highlight the **RCA Evidence Card** ($94\%$ confidence score) and the **Verification Card** showing exact before-and-after values ($94.2\% \to 42.5\%$).
   - Show the chronological event timeline (`DETECTION` $\to$ `RCA_COMPLETED` $\to$ `REMEDIATION_STARTED` $\to$ `REMEDIATION_FINISHED` $\to$ `VERIFICATION_PASSED`).
5. **Demonstrate Autonomous Escalation on Failure:**
   - Click **`Simulate Recovery Failure`**.
   - Show that after executing remediation, the post-remediation metric remains high ($91.5\% \ge 80.0\%$).
   - Show that AURA marks the incident as `FAILED` and appends an `ESCALATED` event notifying human Tier-2 SREs.
6. **Reset:**
   - Click **`Reset Simulation`** to return to live host observation.
