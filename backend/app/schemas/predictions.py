"""
app/schemas/predictions.py
──────────────────────────
Pydantic schemas for case prediction, SHAP explanations, and priority queue ranking.
"""
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel, Field

from app.db.models import ComplexityClass


class SHAPFactorSchema(BaseModel):
    feature: str
    impact: str = Field(..., description="'reduces_delay' or 'increases_delay'")
    impact_days: float
    plain_english_reason: str


class PrecedentFeatureSetSchema(BaseModel):
    top1_similarity: float
    mean_top5_similarity: float
    count_above_threshold: int
    similarity_spread: float
    precedent_age_mean: float
    outcome_agreement: float


class PredictResponse(BaseModel):
    case_id: UUID
    case_no: str
    predicted_days: float
    complexity: ComplexityClass
    priority_score: float
    confidence_interval_days: Tuple[float, float]
    precedent_confidence: float
    precedent_features: PrecedentFeatureSetSchema
    shap_factors: List[SHAPFactorSchema]
    prediction_updated_at: datetime


class RankedCaseItem(BaseModel):
    rank: int
    case_id: UUID
    case_no: str
    court: str
    case_type: str
    filing_date: str
    hearings_count: int
    top1_similarity: float
    predicted_days: float
    complexity: ComplexityClass
    priority_score: float
    eligibility_tag: str  # "Fast-Track Eligible", "Needs Judicial Attention", "Standard"


class QueueRankResponse(BaseModel):
    total_cases: int
    fast_track_count: int
    attention_count: int
    ranked_queue: List[RankedCaseItem]


class MetricRowSchema(BaseModel):
    metric: str
    metadata_only: float
    with_precedents: float
    improvement_pct: float
    unit: str


class FeatureImportanceSchema(BaseModel):
    rank: int
    feature_name: str
    category: str
    importance_score: float


class ModelMetricsResponse(BaseModel):
    dataset_samples: int
    split: str
    algorithm: str
    comparison: List[MetricRowSchema]
    feature_importance: List[FeatureImportanceSchema]
