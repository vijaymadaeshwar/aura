"""
AURA MINI - Metrics & Telemetry Router
"""

from fastapi import APIRouter
from typing import List, Dict, Any
from schemas import SystemMetrics, TelemetrySnapshot
from services.telemetry import collect_system_metrics, get_telemetry_history

router = APIRouter(prefix="/api/metrics", tags=["Metrics & Observability"])


@router.get("/current", response_model=SystemMetrics)
def get_current_metrics():
    """Retrieve real-time hardware telemetry and current system health."""
    return collect_system_metrics()


@router.get("/history", response_model=List[TelemetrySnapshot])
def get_history(limit: int = 30):
    """Retrieve sliding window telemetry data for real-time dashboard charts."""
    return get_telemetry_history(limit=limit)


@router.get("/health")
def get_health_summary() -> Dict[str, Any]:
    """Retrieve overall system health and observability summary."""
    metrics = collect_system_metrics()
    return {
        "status": metrics["status"],
        "uptime": metrics["uptime_formatted"],
        "active_incidents": metrics["active_incidents_count"],
        "is_simulated": metrics["is_simulated"],
        "timestamp": metrics["timestamp"]
    }
