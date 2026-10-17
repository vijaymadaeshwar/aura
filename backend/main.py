"""
AURA — Autonomous Reliability Agent
Backend Application Entry Point
"""

import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Ensure current directory is on python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database import init_db
from utils.logger import log_event
from routers import metrics, incidents, recovery, runbooks, simulator, events, settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    # 1. Initialize PostgreSQL Database
    try:
        init_db()
        log_event("INFO", "CORE", "AURA Autonomous Reliability Agent initialized with PostgreSQL successfully.")
        log_event("INFO", "CORE", "Reliability Loop active: OBSERVE → DETECT → DIAGNOSE → REMEDIATE → VERIFY")
    except Exception as e:
        log_event("ERROR", "DATABASE", f"Failed to initialize PostgreSQL database: {e}")
        raise
    yield
    log_event("INFO", "CORE", "AURA shutting down.")


app = FastAPI(
    title="AURA — Autonomous Reliability Agent",
    description="Automated closed-loop reliability agent: Observe, Detect, Diagnose, Remediate, Verify.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register All API Routers
app.include_router(metrics.router)
app.include_router(incidents.router)
app.include_router(recovery.router)
app.include_router(runbooks.router)
app.include_router(simulator.router)
app.include_router(events.router)
app.include_router(settings.router)

# Mount Static Frontend Dist if built
FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.exists(FRONTEND_DIST):
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API routes
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_DIST, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "agent": "AURA",
            "description": "Autonomous Reliability Agent",
            "mission": "Automating the reliability loop from incident detection to verified recovery.",
            "status": "ONLINE",
            "version": "1.0.0",
            "endpoints": {
                "metrics": "/api/metrics/current",
                "incidents": "/api/incidents",
                "runbooks": "/api/runbooks",
                "recovery": "/api/recovery/history",
                "simulate": "/api/simulate/high-cpu",
                "docs": "/docs"
            }
        }


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    reload = os.getenv("ENVIRONMENT", "development").lower() != "production"
    print("=" * 60)
    print("  AURA — Autonomous Reliability Agent")
    print("  Observe. Diagnose. Recover. Verify.")
    print(f"  Starting unified server at http://0.0.0.0:{port}")
    print("=" * 60)
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=reload)
