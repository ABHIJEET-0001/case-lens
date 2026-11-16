"""
app/main.py
───────────
FastAPI application entrypoint for CaseLens.

Registers:
  GET /health  — liveness + DB connectivity check
  (All feature routers will be mounted here in later steps.)
"""
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.config import settings
from app.api.v1 import api_v1_router
from app.api.v1.search import router as search_router

app = FastAPI(
    title="CaseLens API",
    description="Judicial Intelligence Platform — precedent retrieval, summarisation, and case prioritisation.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Allow the frontend to call the API during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount layered API routes
app.include_router(api_v1_router)
# Also mount unversioned aliases to fulfill original spec endpoints
app.include_router(search_router, prefix="/api")
from app.api.v1.summaries import router as summaries_router
from app.api.v1.cases import router as cases_router
from app.api.v1.predictions import router as predictions_router
app.include_router(summaries_router, prefix="/api")
app.include_router(cases_router, prefix="/api")
app.include_router(predictions_router, prefix="/api")


@app.get("/health", tags=["ops"])
@app.get("/api/v1/health", tags=["ops"])
def health_check(db: Session = Depends(get_db)):
    """
    Returns 200 when the API is up and the database is reachable.
    Used by Docker health-checks and the frontend status indicator.
    """
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {exc}"

    return {
        "status": "ok",
        "db": db_status,
        "environment": settings.environment,
        "version": "0.1.0",
    }
