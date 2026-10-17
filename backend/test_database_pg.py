"""
AURA - PostgreSQL Layer Unit & Integration Tests
Tests PostgreSQL configuration parsing, DDL schemas, Alembic models, and error handling.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import get_db_params, DEFAULT_DATABASE_URL
from database import DatabaseConnectionError, check_db_connection, init_db
from models import Incident, IncidentEvent, RecoveryAction, TelemetryHistory, SystemSetting, Base


def test_postgres_config_parsing():
    """Verify that PostgreSQL connection parameters are parsed properly from environment."""
    params = get_db_params()
    assert params["dbname"] == "aura_reliability_db"
    assert params["user"] == "aura_user"
    assert params["host"] in ("localhost", "127.0.0.1")
    assert params["port"] == 5432
    assert "postgresql://" in DEFAULT_DATABASE_URL


def test_sqlalchemy_postgresql_models():
    """Verify that SQLAlchemy declarative models define correct PostgreSQL tables and constraints."""
    tables = Base.metadata.tables
    assert "incidents" in tables
    assert "incident_events" in tables
    assert "recovery_actions" in tables
    assert "telemetry_history" in tables
    assert "system_settings" in tables

    # Verify column types and foreign keys
    incidents_table = tables["incidents"]
    assert str(incidents_table.c.id.type) == "VARCHAR(64)"
    assert str(incidents_table.c.current_value.type) == "FLOAT"

    events_table = tables["incident_events"]
    assert len(events_table.foreign_keys) == 1
    fk = list(events_table.foreign_keys)[0]
    assert fk.column.table.name == "incidents"
    assert fk.ondelete == "CASCADE"

    recovery_table = tables["recovery_actions"]
    assert len(recovery_table.foreign_keys) == 1
    fk_rec = list(recovery_table.foreign_keys)[0]
    assert fk_rec.column.table.name == "incidents"
    assert fk_rec.ondelete == "CASCADE"


def test_database_connection_error_on_invalid_host():
    """Verify that attempting to connect to an unreachable PostgreSQL host raises DatabaseConnectionError."""
    import database
    import config

    # Temporarily reset pool
    database._connection_pool = None
    
    # Save original env & config
    orig_host = os.environ.get("POSTGRES_HOST")
    orig_url = os.environ.get("DATABASE_URL")
    orig_config_url = config.DATABASE_URL
    orig_timeout = os.environ.get("POSTGRES_CONNECT_TIMEOUT")

    os.environ["DATABASE_URL"] = "postgresql://aura_user:aura_password@invalid-unreachable-host-aura-test:5432/aura_reliability_db"
    config.DATABASE_URL = os.environ["DATABASE_URL"]
    os.environ["POSTGRES_HOST"] = "invalid-unreachable-host-aura-test"
    os.environ["POSTGRES_CONNECT_TIMEOUT"] = "1"

    try:
        with pytest.raises(DatabaseConnectionError) as exc_info:
            database.get_pool()
        assert "Could not connect to PostgreSQL" in str(exc_info.value)
    finally:
        if orig_host is not None:
            os.environ["POSTGRES_HOST"] = orig_host
        else:
            os.environ.pop("POSTGRES_HOST", None)

        if orig_url is not None:
            os.environ["DATABASE_URL"] = orig_url
        else:
            os.environ.pop("DATABASE_URL", None)
        config.DATABASE_URL = orig_config_url

        if orig_timeout is not None:
            os.environ["POSTGRES_CONNECT_TIMEOUT"] = orig_timeout
        else:
            os.environ.pop("POSTGRES_CONNECT_TIMEOUT", None)
        database._connection_pool = None
