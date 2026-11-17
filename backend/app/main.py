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
    allow_origins=settings.cors_origins_list,
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
    Three-state health: ok (DB connected + index loaded), degraded (DB ok, no index), error (DB down).
    """
    import os
    try:
        db.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as exc:
        db_status = f"error: {exc}"

    # Check FAISS index
    index_path = os.path.join(os.path.dirname(__file__), "../../data/faiss_index.bin")
    index_loaded = os.path.isfile(index_path)

    # Determine overall status
    if db_status == "connected" and index_loaded:
        overall = "ok"
    elif db_status == "connected":
        overall = "degraded"
    else:
        overall = "error"

    return {
        "status": overall,
        "db": db_status,
        "index_loaded": index_loaded,
        "embedding_model": "sentence-transformers/all-MiniLM-L6-v2",
        "embedding_dimension": 384,
        "environment": settings.environment,
        "version": "0.1.0",
    }
