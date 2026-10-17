"""
AURA - Pydantic Data Models & Request/Response Schemas
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class SeverityEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class IncidentStatusEnum(str, Enum):
    DETECTED = "DETECTED"
    INVESTIGATING = "INVESTIGATING"
    REMEDIATING = "REMEDIATING"
    VERIFYING = "VERIFYING"
    RESOLVED = "RESOLVED"
    FAILED = "FAILED"


class HealthStatusEnum(str, Enum):
    HEALTHY = "HEALTHY"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class SystemMetrics(BaseModel):
    cpu: float = Field(..., description="CPU utilization percentage")
    memory: float = Field(..., description="RAM memory utilization percentage")
    disk: float = Field(..., description="Disk utilization percentage")
    network_mb_s: float = Field(..., description="Combined network transfer rate in MB/s")
    uptime_seconds: float = Field(..., description="Host uptime in seconds")
    uptime_formatted: str = Field(..., description="Human readable uptime (e.g. 4d 12h 30m)")
    status: HealthStatusEnum = Field(..., description="Overall system health status")
    timestamp: str = Field(..., description="ISO or local time string")
    active_incidents_count: int = Field(0, description="Count of unresolved incidents")
    is_simulated: bool = Field(False, description="Whether active metrics are currently simulated")


class TelemetrySnapshot(BaseModel):
    id: Optional[int] = None
    cpu: float
    memory: float
    disk: float
    network_mb_s: float
    timestamp: str


class IncidentEvent(BaseModel):
    id: Optional[int] = None
    incident_id: str
    event_type: str
    message: str
    timestamp: str


class RecoveryAction(BaseModel):
    id: Optional[int] = None
    incident_id: str
    runbook_id: str
    action_name: str
    status: str
    before_value: Optional[float] = None
    after_value: Optional[float] = None
    started_at: str
    completed_at: Optional[str] = None


class Incident(BaseModel):
    id: str
    type: str
    severity: SeverityEnum
    status: IncidentStatusEnum
    metric: str
    current_value: float
    threshold: float
    root_cause: Optional[str] = None
    confidence: Optional[int] = None
    evidence: Optional[str] = None
    recommended_action: Optional[str] = None
    created_at: str
    resolved_at: Optional[str] = None
    events: Optional[List[IncidentEvent]] = None
    recovery_action: Optional[RecoveryAction] = None


class IncidentCreate(BaseModel):
    type: str
    severity: SeverityEnum = SeverityEnum.HIGH
    metric: str
    current_value: float
    threshold: float
    root_cause: Optional[str] = None
    confidence: Optional[int] = None
    evidence: Optional[str] = None
    recommended_action: Optional[str] = None


class Runbook(BaseModel):
    id: str
    name: str
    description: str
    trigger: str
    preconditions: str
    action: str
    verification_condition: str
    success_condition: str
    failure_condition: str


class SystemSettings(BaseModel):
    cpu_threshold: float = 80.0
    memory_threshold: float = 85.0
    disk_threshold: float = 90.0
    auto_remediation_enabled: bool = True
    polling_interval_sec: float = 3.0


class SimulationScenarioEnum(str, Enum):
    HIGH_CPU = "high-cpu"
    HIGH_MEMORY = "high-memory"
    APPLICATION_FAILURE = "application-failure"
    RECOVERY_FAILURE = "recovery-failure"


class SimulationResponse(BaseModel):
    success: bool
    scenario: str
    message: str
    incident_id: Optional[str] = None
    initial_metric_value: Optional[float] = None


class LogEntry(BaseModel):
    timestamp: str
    level: str
    source: str
    message: str
