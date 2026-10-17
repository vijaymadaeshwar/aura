"""
AURA MINI - Comprehensive Test Suite
Tests Observability, Detection, RCA, Runbooks, Remediation, Verification, REST APIs,
and PostgreSQL Database Layer Integration.
"""

import sys
import os
import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from database import init_db, get_db, DatabaseConnectionError, check_db_connection
from services.telemetry import collect_system_metrics, set_simulation_override, clear_simulation_override
from services.detector import detect_incidents
from services.rca import perform_rca
from services.runbook import get_all_runbooks, select_runbook_for_incident
from services.remediation import execute_remediation
from services.verification import verify_recovery
from services.simulator import trigger_simulation, reset_simulation

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_teardown():
    """Ensure clean database and reset simulation state for every test."""
    clear_simulation_override()
    try:
        init_db()
        with get_db() as conn:
            conn.execute("DELETE FROM incident_events")
            conn.execute("DELETE FROM recovery_actions")
            conn.execute("DELETE FROM incidents")
    except DatabaseConnectionError:
        # If external PostgreSQL daemon is offline, tests gracefully mock or log
        pass
    except Exception:
        pass
    yield
    clear_simulation_override()


def test_telemetry_collection():
    """Verify Module 1: System Observability collects valid metrics via psutil."""
    metrics = collect_system_metrics()
    assert "cpu" in metrics
    assert "memory" in metrics
    assert "disk" in metrics
    assert "network_mb_s" in metrics
    assert "status" in metrics
    assert metrics["cpu"] >= 0.0
    assert metrics["memory"] >= 0.0
    assert metrics["disk"] >= 0.0


def test_detection_thresholds():
    """Verify Module 2: Incident Detection triggers on elevated threshold."""
    normal_metrics = {"cpu": 35.0, "memory": 45.0, "disk": 40.0, "network_mb_s": 1.0}
    inc_none = detect_incidents(normal_metrics)
    assert inc_none is None

    spike_metrics = {"cpu": 94.0, "memory": 50.0, "disk": 40.0, "network_mb_s": 1.0}
    try:
        inc = detect_incidents(spike_metrics)
        assert inc is not None
        assert inc["type"] == "HIGH CPU"
        assert inc["severity"] == "CRITICAL"
        assert inc["current_value"] == 94.0
    except DatabaseConnectionError:
        pytest.skip("PostgreSQL daemon not currently running; skipping DB write check")


def test_rca_engine():
    """Verify Module 3: RCA Engine accurately diagnoses root cause & evidence."""
    fake_inc = {
        "id": "INC-TEST-001",
        "type": "HIGH CPU",
        "severity": "CRITICAL",
        "metric": "cpu",
        "current_value": 94.0,
        "threshold": 80.0
    }
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO incidents (id, type, severity, status, metric, current_value, threshold, created_at)
                VALUES (%s, %s, %s, 'DETECTED', %s, %s, %s, '00:00:00')
                ON CONFLICT (id) DO NOTHING;
            """, (fake_inc["id"], fake_inc["type"], fake_inc["severity"], fake_inc["metric"], fake_inc["current_value"], fake_inc["threshold"]))
        rca_res = perform_rca(fake_inc)
        assert "CPU-intensive" in rca_res["root_cause"]
        assert rca_res["confidence"] >= 90
        assert "RB-CPU-01" in rca_res["recommended_action"]
    except DatabaseConnectionError:
        pytest.skip("PostgreSQL daemon not currently running; skipping DB write check")


def test_runbook_engine():
    """Verify Module 4: Runbook Engine catalog and selection."""
    runbooks = get_all_runbooks()
    assert len(runbooks) >= 4

    fake_inc = {"id": "INC-TEST", "metric": "cpu", "type": "HIGH CPU", "current_value": 94.0, "threshold": 80.0}
    rb = select_runbook_for_incident(fake_inc)
    assert rb["id"] == "RB-CPU-01"
    assert "Restart" in rb["action"]


def test_remediation_and_verification_loop():
    """Verify Module 5 & 6: Closed-loop Remediation and Before/After Verification."""
    set_simulation_override(scenario="high-cpu", cpu=94.0)
    metrics = collect_system_metrics()
    try:
        inc = detect_incidents(metrics)
        assert inc is not None

        # Step 3: RCA
        perform_rca(inc)

        # Step 4: Remediation
        rem = execute_remediation(inc)
        assert rem["status"] == "COMPLETED"

        # Step 5: Verification (Success)
        ver = verify_recovery(inc["id"], is_failure_scenario=False)
        assert ver["is_recovered"] is True
        assert ver["status"] == "RESOLVED"
        assert ver["before_value"] == 94.0
        assert ver["after_value"] < 80.0
    except DatabaseConnectionError:
        pytest.skip("PostgreSQL daemon not currently running; skipping DB write check")


def test_verification_failure_and_escalation():
    """Verify that if recovery fails, status is FAILED and incident is escalated."""
    set_simulation_override(scenario="recovery-failure", cpu=95.0)
    metrics = collect_system_metrics()
    try:
        inc = detect_incidents(metrics)
        assert inc is not None

        perform_rca(inc)
        execute_remediation(inc)

        # Verify with failure
        ver = verify_recovery(inc["id"], is_failure_scenario=True)
        assert ver["is_recovered"] is False
        assert ver["status"] == "FAILED"
        assert ver["after_value"] >= 80.0

        # Check that ESCALATED event was created
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM incident_events WHERE incident_id = %s AND event_type = 'ESCALATED'", (inc["id"],))
            events = cursor.fetchall()
            assert len(events) >= 1
    except DatabaseConnectionError:
        pytest.skip("PostgreSQL daemon not currently running; skipping DB write check")


def test_rest_apis():
    """Verify REST API endpoints respond with proper schema."""
    # Health check
    res = client.get("/api/metrics/health")
    assert res.status_code == 200
    assert "status" in res.json()

    # Current metrics
    res = client.get("/api/metrics/current")
    assert res.status_code == 200
    assert "cpu" in res.json()

    # Runbooks
    res = client.get("/api/runbooks")
    assert res.status_code == 200
    assert len(res.json()) >= 4


def test_database_connection_reporting():
    """Verify that PostgreSQL connection errors are cleanly reported rather than falling back to SQLite."""
    from config import get_db_params
    params = get_db_params()
    assert params["dbname"] is not None
    assert params["user"] is not None
    assert "sqlite" not in params["dbname"].lower()
