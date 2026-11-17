"""
app/api/v1/system.py
────────────────────
FastAPI router for system health, runtime diagnostics, and corpus status.
"""
import os
from pathlib import Path
from typing import Dict, Any

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.session import get_db
from app.db.models import Judgment, PendingCase
from app.config import settings

router = APIRouter(prefix="/system", tags=["system"])

INDEX_PATH = Path("/app/data/index/judgments.faiss")
LOCAL_INDEX_PATH = Path(__file__).resolve().parent.parent.parent.parent / "data" / "index" / "judgments.faiss"


@router.get("/status", summary="Get comprehensive system runtime telemetry and corpus diagnostics")
def get_system_status(db: Session = Depends(get_db)) -> Dict[str, Any]:
    # 1. Database Connectivity & Counts
    db_status = "connected"
    judgments_count = 0
    pending_cases_count = 0
    try:
        db.execute(text("SELECT 1"))
        judgments_count = db.query(Judgment).count()
        pending_cases_count = db.query(PendingCase).count()
    except Exception as exc:
        db_status = f"error: {exc}"

    # 2. FAISS Index Status
    faiss_exists = INDEX_PATH.exists() or LOCAL_INDEX_PATH.exists()
    faiss_vector_count = 0
    if faiss_exists:
        try:
            import faiss
            target = INDEX_PATH if INDEX_PATH.exists() else LOCAL_INDEX_PATH
            index = faiss.read_index(str(target))
            faiss_vector_count = index.ntotal
        except Exception:
            faiss_vector_count = 0

    # 3. Model Configuration
    embedding_model = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
    embedding_dimension = 384
    if "inlegalbert" in embedding_model.lower():
        embedding_dimension = 768

    gemini_configured = bool(settings.gemini_api_key.strip())

    return {
        "backend": "ok",
        "database": db_status,
        "db_judgments_count": judgments_count,
        "db_pending_cases_count": pending_cases_count,
        "faiss_index_exists": faiss_exists,
        "faiss_vector_count": faiss_vector_count,
        "embedding_model": embedding_model,
        "embedding_dimension": embedding_dimension,
        "distance_metric": "Inner Product (Cosine Similarity via L2-norm)",
        "gemini_api_configured": gemini_configured,
        "summarizer_mode": "Gemini API with Extractive TextRank Fallback",
        "version": "0.1.0",
        "environment": settings.environment,
    }
