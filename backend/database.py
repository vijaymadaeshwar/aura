"""
AURA MINI - PostgreSQL Database Layer
Provides connection pooling, transaction context management, and schema migrations for PostgreSQL.
"""

import os
import sys
import logging
from contextlib import contextmanager
from typing import Generator, Dict, Any, Optional, List, Tuple
import psycopg2
from psycopg2 import pool
from psycopg2.extras import RealDictCursor, RealDictRow

# Ensure current directory on path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from config import get_db_params, DATABASE_URL

logger = logging.getLogger("AURA_MINI.database")

# Global connection pool
_connection_pool: Optional[pool.ThreadedConnectionPool] = None


class DatabaseConnectionError(Exception):
    """Raised when PostgreSQL database connection cannot be established."""
    pass


def get_pool() -> pool.ThreadedConnectionPool:
    """Initialize and retrieve the PostgreSQL connection pool."""
    global _connection_pool
    if _connection_pool is None or _connection_pool.closed:
        params = get_db_params()
        timeout = int(os.getenv("POSTGRES_CONNECT_TIMEOUT", "2"))
        try:
            _connection_pool = pool.ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                dbname=params["dbname"],
                user=params["user"],
                password=params["password"],
                host=params["host"],
                port=params["port"],
                cursor_factory=RealDictCursor,
                connect_timeout=timeout
            )
            logger.info(f"PostgreSQL connection pool initialized for {params['user']}@{params['host']}:{params['port']}/{params['dbname']}")
        except Exception as e:
            logger.error(f"Failed to connect to PostgreSQL at {params['host']}:{params['port']}/{params['dbname']}: {e}")
            raise DatabaseConnectionError(
                f"Could not connect to PostgreSQL database '{params['dbname']}' on {params['host']}:{params['port']}. "
                f"Error: {e}. Please ensure PostgreSQL is running and credentials in .env/DATABASE_URL are correct."
            ) from e
    return _connection_pool


class PostgresConnectionWrapper:
    """
    Wraps a psycopg2 connection to provide a seamless interface for cursor execution,
    automatic RealDictCursor dictionaries, and transaction control.
    """
    def __init__(self, raw_conn, from_pool: bool = True):
        self._conn = raw_conn
        self._from_pool = from_pool

    def cursor(self, *args, **kwargs):
        """Return a RealDictCursor for dict-like row access."""
        kwargs.setdefault("cursor_factory", RealDictCursor)
        return self._conn.cursor(*args, **kwargs)

    def execute(self, query: str, params: Optional[Tuple[Any, ...]] = None):
        """Direct execute on connection returning a cursor."""
        cur = self.cursor()
        cur.execute(query, params)
        return cur

    def commit(self):
        self._conn.commit()

    def rollback(self):
        self._conn.rollback()

    def close(self):
        global _connection_pool
        if self._from_pool and _connection_pool and not _connection_pool.closed:
            _connection_pool.putconn(self._conn)
        else:
            self._conn.close()


def get_db_connection() -> PostgresConnectionWrapper:
    """Obtain a thread-safe connection to PostgreSQL."""
    p = get_pool()
    raw_conn = p.getconn()
    raw_conn.autocommit = False
    return PostgresConnectionWrapper(raw_conn, from_pool=True)


@contextmanager
def get_db() -> Generator[PostgresConnectionWrapper, None, None]:
    """
    Context manager for transactional database operations.
    Commits on successful block execution, rollbacks on error, and releases connection back to pool.
    """
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def check_db_connection() -> Dict[str, Any]:
    """Verify PostgreSQL connectivity and return metadata."""
    params = get_db_params()
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT version() as version, current_database() as db, current_user as user;")
        info = cursor.fetchone()
        return {
            "status": "CONNECTED",
            "database": info["db"],
            "user": info["user"],
            "version": info["version"],
            "host": params["host"],
            "port": params["port"]
        }


def init_db() -> None:
    """
    Initialize all PostgreSQL database tables, indexes, and default settings.
    Idempotent and safe to run on every application startup.
    """
    logger.info("Initializing PostgreSQL schema for AURA Mini...")
    with get_db() as conn:
        cursor = conn.cursor()

        # 1. Incidents Table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incidents (
                id VARCHAR(64) PRIMARY KEY,
                type VARCHAR(64) NOT NULL,
                severity VARCHAR(32) NOT NULL,
                status VARCHAR(32) NOT NULL,
                metric VARCHAR(64) NOT NULL,
                current_value DOUBLE PRECISION NOT NULL,
                threshold DOUBLE PRECISION NOT NULL,
                root_cause TEXT,
                confidence INTEGER,
                evidence TEXT,
                recommended_action TEXT,
                created_at VARCHAR(64) NOT NULL,
                resolved_at VARCHAR(64)
            );
        """)

        # 2. Incident Events Table (Chronological timeline)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS incident_events (
                id SERIAL PRIMARY KEY,
                incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
                event_type VARCHAR(64) NOT NULL,
                message TEXT NOT NULL,
                timestamp VARCHAR(64) NOT NULL
            );
        """)

        # 3. Recovery Actions Table (Audit history)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS recovery_actions (
                id SERIAL PRIMARY KEY,
                incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
                runbook_id VARCHAR(64) NOT NULL,
                action_name TEXT NOT NULL,
                status VARCHAR(32) NOT NULL,
                before_value DOUBLE PRECISION,
                after_value DOUBLE PRECISION,
                started_at VARCHAR(64) NOT NULL,
                completed_at VARCHAR(64)
            );
        """)

        # 4. Telemetry History Table (Sliding chart window)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS telemetry_history (
                id SERIAL PRIMARY KEY,
                cpu DOUBLE PRECISION NOT NULL,
                memory DOUBLE PRECISION NOT NULL,
                disk DOUBLE PRECISION NOT NULL,
                network_mb_s DOUBLE PRECISION NOT NULL,
                timestamp VARCHAR(64) NOT NULL
            );
        """)

        # 5. System Settings Table (Dynamic thresholds & Auto-recovery flag)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS system_settings (
                key VARCHAR(64) PRIMARY KEY,
                value TEXT NOT NULL
            );
        """)

        # Performance Indexes
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_metric ON incidents(metric);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_incident_events_incident_id ON incident_events(incident_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_recovery_actions_incident_id ON recovery_actions(incident_id);")
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_telemetry_history_id ON telemetry_history(id DESC);")

        # Seed Default System Settings (Idempotent)
        defaults = [
            ("cpu_threshold", "80.0"),
            ("memory_threshold", "85.0"),
            ("disk_threshold", "90.0"),
            ("auto_remediation_enabled", "true"),
            ("polling_interval_sec", "3.0")
        ]
        for key, val in defaults:
            cursor.execute("""
                INSERT INTO system_settings (key, value)
                VALUES (%s, %s)
                ON CONFLICT (key) DO NOTHING;
            """, (key, val))

    logger.info("PostgreSQL database tables and indexes initialized successfully.")
