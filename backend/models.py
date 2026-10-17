"""
AURA - SQLAlchemy Declarative Models
Defines relational schemas for PostgreSQL and Alembic migrations.
"""

from sqlalchemy import Column, String, Integer, Float, Text, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True)
    type = Column(String(64), nullable=False)
    severity = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False)
    metric = Column(String(64), nullable=False)
    current_value = Column(Float, nullable=False)
    threshold = Column(Float, nullable=False)
    root_cause = Column(Text, nullable=True)
    confidence = Column(Integer, nullable=True)
    evidence = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    created_at = Column(String(64), nullable=False)
    resolved_at = Column(String(64), nullable=True)

    events = relationship("IncidentEvent", back_populates="incident", cascade="all, delete-orphan")
    recovery_actions = relationship("RecoveryAction", back_populates="incident", cascade="all, delete-orphan")

    __table_args__ = (
        Index("idx_incidents_status", "status"),
        Index("idx_incidents_metric", "metric"),
        Index("idx_incidents_created_at", "created_at"),
    )


class IncidentEvent(Base):
    __tablename__ = "incident_events"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String(64), nullable=False)
    message = Column(Text, nullable=False)
    timestamp = Column(String(64), nullable=False)

    incident = relationship("Incident", back_populates="events")

    __table_args__ = (
        Index("idx_incident_events_incident_id", "incident_id"),
    )


class RecoveryAction(Base):
    __tablename__ = "recovery_actions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    runbook_id = Column(String(64), nullable=False)
    action_name = Column(Text, nullable=False)
    status = Column(String(32), nullable=False)
    before_value = Column(Float, nullable=True)
    after_value = Column(Float, nullable=True)
    started_at = Column(String(64), nullable=False)
    completed_at = Column(String(64), nullable=True)

    incident = relationship("Incident", back_populates="recovery_actions")

    __table_args__ = (
        Index("idx_recovery_actions_incident_id", "incident_id"),
    )


class TelemetryHistory(Base):
    __tablename__ = "telemetry_history"

    id = Column(Integer, primary_key=True, autoincrement=True)
    cpu = Column(Float, nullable=False)
    memory = Column(Float, nullable=False)
    disk = Column(Float, nullable=False)
    network_mb_s = Column(Float, nullable=False)
    timestamp = Column(String(64), nullable=False)

    __table_args__ = (
        Index("idx_telemetry_history_id", "id"),
    )


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(64), primary_key=True)
    value = Column(Text, nullable=False)
