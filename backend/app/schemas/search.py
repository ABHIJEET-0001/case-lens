"""
app/schemas/search.py
─────────────────────
Pydantic validation schemas for the CaseLens Precedent Search API.
"""
from typing import Optional, List, Literal
from uuid import UUID
from datetime import date
from pydantic import BaseModel, Field


class SearchFilters(BaseModel):
    court: Optional[str] = Field(None, description="Filter by court name (case-insensitive substring match)")
    case_type: Optional[str] = Field(None, description="Filter by case classification (e.g. CRL.A, WP, SLP)")
    year_from: Optional[int] = Field(None, description="Starting judgment year (inclusive)")
    year_to: Optional[int] = Field(None, description="Ending judgment year (inclusive)")
    outcome: Optional[str] = Field(None, description="Filter by outcome (e.g. Allowed, Dismissed)")


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, description="Legal issue, factual matrix, statute section, or citation")
    filters: Optional[SearchFilters] = None
    top_k: int = Field(10, ge=1, le=50, description="Maximum number of ranked precedents to return")
    method: Literal["hybrid", "semantic", "keyword"] = Field(
        "hybrid",
        description="Retrieval method: 'semantic' (FAISS cosine), 'keyword' (TF-IDF), or 'hybrid' (weighted combination)"
    )


class PrecedentSummarySchema(BaseModel):
    facts: Optional[str] = None
    issue: Optional[str] = None
    holding: Optional[str] = None
    outcome_text: Optional[str] = None
    model_used: Optional[str] = None


class PrecedentResult(BaseModel):
    id: UUID
    title: str
    citation: Optional[str] = None
    court: str
    judgment_date: Optional[date] = None
    case_type: Optional[str] = None
    outcome: Optional[str] = None
    bench: Optional[str] = None
    word_count: Optional[int] = None
    similarity_score: float = Field(..., description="Cosine similarity score (0.0 to 1.0) from FAISS index")
    keyword_score: float = Field(0.0, description="TF-IDF keyword score (0.0 to 1.0) for comparison")
    hybrid_score: float = Field(..., description="Combined hybrid ranking score")
    matched_snippet: str = Field("", description="Most relevant passage snippet from the judgment")
    summary: Optional[PrecedentSummarySchema] = None


class SearchResponse(BaseModel):
    query: str
    total_found: int
    retrieval_method: str
    latency_ms: float
    results: List[PrecedentResult]
