"""
AURA - Runbooks API Router
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from schemas import Runbook
from services.runbook import get_all_runbooks, get_runbook_by_id

router = APIRouter(prefix="/api/runbooks", tags=["Runbooks"])


@router.get("", response_model=List[Runbook])
def list_runbooks():
    """Retrieve list of all predefined reliability runbooks."""
    return get_all_runbooks()


@router.get("/{runbook_id}", response_model=Runbook)
def get_runbook(runbook_id: str):
    """Retrieve details of a specific runbook."""
    rb = get_runbook_by_id(runbook_id)
    if not rb:
        raise HTTPException(status_code=404, detail=f"Runbook {runbook_id} not found.")
    return rb
