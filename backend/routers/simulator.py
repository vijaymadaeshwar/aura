"""
AURA MINI - Incident Simulator API Router
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Dict, Any
from schemas import SimulationResponse, SimulationScenarioEnum
from services.simulator import trigger_simulation, reset_simulation

router = APIRouter(prefix="/api/simulate", tags=["Incident Simulator"])


@router.post("/high-cpu")
def simulate_high_cpu(auto_execute: bool = Query(True, description="Run entire closed-loop automatically")):
    """Trigger a simulated High CPU incident (CPU=94.2%)."""
    return trigger_simulation("high-cpu", auto_execute_loop=auto_execute)


@router.post("/high-memory")
def simulate_high_memory(auto_execute: bool = Query(True, description="Run entire closed-loop automatically")):
    """Trigger a simulated High Memory incident (Memory=94.5%)."""
    return trigger_simulation("high-memory", auto_execute_loop=auto_execute)


@router.post("/application-failure")
def simulate_application_failure(auto_execute: bool = Query(True, description="Run entire closed-loop automatically")):
    """Trigger a simulated Application / DB Failure incident."""
    return trigger_simulation("application-failure", auto_execute_loop=auto_execute)


@router.post("/recovery-failure")
def simulate_recovery_failure(auto_execute: bool = Query(True, description="Run entire closed-loop automatically")):
    """Trigger a simulated failed recovery to demonstrate escalation path."""
    return trigger_simulation("recovery-failure", auto_execute_loop=auto_execute)


@router.post("/scenario/{scenario}")
def simulate_scenario(scenario: str, auto_execute: bool = Query(True)):
    """Generic endpoint to trigger any scenario by name."""
    try:
        return trigger_simulation(scenario, auto_execute_loop=auto_execute)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/reset")
def reset_sim():
    """Reset simulation telemetry and restore normal live system observation."""
    return reset_simulation()
