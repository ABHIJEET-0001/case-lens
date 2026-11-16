"""
app/schemas/cases.py
───────────────────
Pydantic validation schemas for Pending Cases CRUD and Docket Management.
"""
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from pydantic import BaseModel, Field

from app.db.models import CaseStatus, ComplexityClass


class CaseCreateSchema(BaseModel):
    case_no: str = Field(..., min_length=3, max_length=100, description="Registry number, e.g. CRL.A. 1421/2023")
    case_type: str = Field(..., max_length=100, description="Case type, e.g. CRL.A, W.P.(C), SLP")
    court: str = Field(..., max_length=255, description="Court name, e.g. Supreme Court of India")
    filing_date: date = Field(..., description="Date of case registration in registry")
    hearings_count: int = Field(0, ge=0, description="Number of hearings completed so far")
    description: Optional[str] = Field(None, description="Factual matrix and legal grounds")
    status: CaseStatus = Field(CaseStatus.pending, description="Current docket stage")


class CaseUpdateSchema(BaseModel):
    court: Optional[str] = None
    hearings_count: Optional[int] = Field(None, ge=0)
    description: Optional[str] = None
    status: Optional[CaseStatus] = None


class CaseResponseSchema(BaseModel):
    id: UUID
    case_no: str
    case_type: str
    court: str
    filing_date: date
    hearings_count: int
    description: Optional[str] = None
    status: CaseStatus
    assigned_to: Optional[UUID] = None

    # Precedent-strength features
    top1_similarity: Optional[float] = None
    mean_top5_similarity: Optional[float] = None
    count_above_threshold: Optional[int] = None
    similarity_spread: Optional[float] = None
    precedent_age_mean: Optional[float] = None
    outcome_agreement: Optional[float] = None

    # Prediction outputs
    predicted_days: Optional[float] = None
    complexity: Optional[ComplexityClass] = None
    priority_score: Optional[float] = None
    shap_reasons: Optional[str] = None
    prediction_updated_at: Optional[datetime] = None

    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CaseListResponseSchema(BaseModel):
    total: int
    cases: List[CaseResponseSchema]
