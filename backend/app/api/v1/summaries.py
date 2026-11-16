"""
app/api/v1/summaries.py
───────────────────────
Summarization API router for judgments.
GET /api/v1/judgments/{id}/summary
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import PrecedentSummarySchema
from app.services.summarizer_service import SummarizerService

router = APIRouter(prefix="/judgments", tags=["summarization"])


@router.get(
    "/{judgment_id}/summary",
    response_model=PrecedentSummarySchema,
    status_code=status.HTTP_200_OK,
    summary="Retrieve or generate a 4-part legal summary for a court judgment",
    description="Returns cached summary if available; otherwise invokes Gemini API (with deterministic extractive fallback) and caches result in PostgreSQL.",
)
def get_judgment_summary(
    judgment_id: UUID, db: Session = Depends(get_db)
) -> PrecedentSummarySchema:
    try:
        service = SummarizerService(db)
        return service.get_or_generate_summary(judgment_id)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Summarization processing error: {str(exc)}",
        )
