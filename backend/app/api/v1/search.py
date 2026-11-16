"""
app/api/v1/search.py
────────────────────
FastAPI route controller for Precedent Search.
POST /api/v1/search
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.search import SearchRequest, SearchResponse
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["search"])


@router.post(
    "",
    response_model=SearchResponse,
    status_code=status.HTTP_200_OK,
    summary="Search Indian judicial precedents using FAISS vector retrieval & TF-IDF baseline",
    description="Embeds query with InLegalBERT / MiniLM, performs cosine similarity lookup in FAISS, applies court/case-type filters, and returns ranked precedents with matching text snippets.",
)
def search_precedents(
    request: SearchRequest, db: Session = Depends(get_db)
) -> SearchResponse:
    try:
        service = SearchService(db)
        return service.search(request)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Precedent search execution failed: {str(exc)}",
        )
