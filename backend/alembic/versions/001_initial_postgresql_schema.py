"""Initial PostgreSQL Schema for AURA

Revision ID: 001_initial_postgresql_schema
Revises: 
Create Date: 2026-10-03 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = '001_initial_postgresql_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Incidents Table
    op.create_table(
        'incidents',
        sa.Column('id', sa.String(length=64), nullable=False),
        sa.Column('type', sa.String(length=64), nullable=False),
        sa.Column('severity', sa.String(length=32), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('metric', sa.String(length=64), nullable=False),
        sa.Column('current_value', sa.Float(), nullable=False),
        sa.Column('threshold', sa.Float(), nullable=False),
        sa.Column('root_cause', sa.Text(), nullable=True),
        sa.Column('confidence', sa.Integer(), nullable=True),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.Column('recommended_action', sa.Text(), nullable=True),
        sa.Column('created_at', sa.String(length=64), nullable=False),
        sa.Column('resolved_at', sa.String(length=64), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_incidents_status', 'incidents', ['status'], unique=False)
    op.create_index('idx_incidents_metric', 'incidents', ['metric'], unique=False)
    op.create_index('idx_incidents_created_at', 'incidents', ['created_at'], unique=False)

    # 2. Incident Events Table
    op.create_table(
        'incident_events',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('incident_id', sa.String(length=64), nullable=False),
        sa.Column('event_type', sa.String(length=64), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('timestamp', sa.String(length=64), nullable=False),
        sa.ForeignKeyConstraint(['incident_id'], ['incidents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_incident_events_incident_id', 'incident_events', ['incident_id'], unique=False)

    # 3. Recovery Actions Table
    op.create_table(
        'recovery_actions',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('incident_id', sa.String(length=64), nullable=False),
        sa.Column('runbook_id', sa.String(length=64), nullable=False),
        sa.Column('action_name', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=32), nullable=False),
        sa.Column('before_value', sa.Float(), nullable=True),
        sa.Column('after_value', sa.Float(), nullable=True),
        sa.Column('started_at', sa.String(length=64), nullable=False),
        sa.Column('completed_at', sa.String(length=64), nullable=True),
        sa.ForeignKeyConstraint(['incident_id'], ['incidents.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_recovery_actions_incident_id', 'recovery_actions', ['incident_id'], unique=False)

    # 4. Telemetry History Table
    op.create_table(
        'telemetry_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('cpu', sa.Float(), nullable=False),
        sa.Column('memory', sa.Float(), nullable=False),
        sa.Column('disk', sa.Float(), nullable=False),
        sa.Column('network_mb_s', sa.Float(), nullable=False),
        sa.Column('timestamp', sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_telemetry_history_id', 'telemetry_history', ['id'], unique=False)

    # 5. System Settings Table
    op.create_table(
        'system_settings',
        sa.Column('key', sa.String(length=64), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('key')
    )


def downgrade() -> None:
    op.drop_table('system_settings')
    op.drop_index('idx_telemetry_history_id', table_name='telemetry_history')
    op.drop_table('telemetry_history')
    op.drop_index('idx_recovery_actions_incident_id', table_name='recovery_actions')
    op.drop_table('recovery_actions')
    op.drop_index('idx_incident_events_incident_id', table_name='incident_events')
    op.drop_table('incident_events')
    op.drop_index('idx_incidents_created_at', table_name='incidents')
    op.drop_index('idx_incidents_metric', table_name='incidents')
    op.drop_index('idx_incidents_status', table_name='incidents')
    op.drop_table('incidents')
