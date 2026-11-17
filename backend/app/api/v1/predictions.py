"""
app/api/v1/predictions.py
─────────────────────────
FastAPI routes for Resolution Forecasting, SHAP Explanations, and Queue Ranking.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.predictions import (
    PredictResponse,
    QueueRankResponse,
    ModelMetricsResponse,
)
from app.services.prediction_service import PredictionService

router = APIRouter(tags=["predictions"])


@router.post(
    "/cases/{case_id}/predict",
    response_model=PredictResponse,
    status_code=status.HTTP_200_OK,
    summary="Compute precedent features and forecast time-to-resolution with SHAP explanations",
    description="Extracts the 6 precedent-strength features from retrieved authorities, runs regression inference, determines complexity class, calculates priority score, and produces plain-English SHAP factors.",
)
def predict_case_resolution(
    case_id: UUID, db: Session = Depends(get_db)
) -> PredictResponse:
    try:
        service = PredictionService(db)
        return service.predict_for_case(case_id)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err),
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Prediction execution failed: {str(exc)}",
        )


@router.post(
    "/queue/approve/{case_id}",
    status_code=status.HTTP_200_OK,
    summary="Judge approves case priority listing and sets status to reserved or expedited",
)
def approve_queue_listing(case_id: UUID, db: Session = Depends(get_db)):
    from app.db.models import PendingCase, CaseStatus
    from datetime import datetime
    case = db.query(PendingCase).filter(PendingCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found.")
    case.status = CaseStatus.hearing
    case.prediction_updated_at = datetime.utcnow()
    db.commit()
    return {"status": "approved", "case_id": str(case_id), "stage": "hearing"}


@router.post(
    "/queue/rank",
    response_model=QueueRankResponse,
    status_code=status.HTTP_200_OK,
    summary="Produce prioritized judicial queue ordered by urgency and precedent readiness",
    description="Ranks all active pending cases and splits them into 'Fast-Track Eligible' and 'Needs Judicial Attention' buckets.",
)
def rank_judicial_queue(db: Session = Depends(get_db)) -> QueueRankResponse:
    try:
        service = PredictionService(db)
        return service.rank_queue()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Queue ranking calculation failed: {str(exc)}",
        )


@router.get(
    "/model/metrics",
    response_model=ModelMetricsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get model benchmark report comparing Metadata-Only vs Precedent-Enhanced models",
    description="Exposes MAE, RMSE, R², and SHAP feature importance rankings for academic panel evaluation.",
)
def get_benchmark_metrics(db: Session = Depends(get_db)) -> ModelMetricsResponse:
    try:
        service = PredictionService(db)
        return service.get_model_metrics()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read model metrics: {str(exc)}",
        )


@router.get(
    "/model/retrieval-metrics",
    status_code=status.HTTP_200_OK,
    summary="Retrieval evaluation: Precision@5 and MRR for TF-IDF vs semantic vs hybrid",
)
def get_retrieval_metrics() -> dict:
    """
    Returns the last-computed retrieval evaluation on the 30-query gold set.
    If ml/metrics.json exists, reads from it; otherwise returns placeholder with a note.
    """
    import json, os
    metrics_path = os.path.join(os.path.dirname(__file__), "../../../../ml/metrics.json")
    if os.path.isfile(metrics_path):
        with open(metrics_path) as f:
            return json.load(f)
    return {
        "note": "Retrieval evaluation not yet run. Execute `make eval` to generate.",
        "gold_set_queries": 30,
        "methods": {
            "tfidf":    {"precision_at_5": None, "mrr": None},
            "semantic": {"precision_at_5": None, "mrr": None},
            "hybrid":   {"precision_at_5": None, "mrr": None},
        },
    }
