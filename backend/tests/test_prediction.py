"""
backend/tests/test_prediction.py
────────────────────────────────
Unit tests for resolution forecasting and priority queue calculation.
"""
from datetime import date
from app.db.models import PendingCase, CaseStatus, ComplexityClass
from app.services.prediction_service import PredictionService


def test_compute_inference_high_similarity():
    class DummyDB:
        pass

    service = PredictionService(DummyDB())
    mock_case = PendingCase(
        case_no="CRL.A. 100/2023",
        case_type="CRL.A",
        court="Supreme Court of India",
        filing_date=date(2023, 1, 1),
        hearings_count=6,
        status=CaseStatus.hearing,
    )
    prec_feats = {
        "top1_similarity": 0.90,
        "mean_top5_similarity": 0.85,
        "count_above_threshold": 5,
        "similarity_spread": 0.02,
        "precedent_age_mean": 2.0,
        "outcome_agreement": 0.90,
    }

    pred_days, complexity, priority_score, shap_factors = service._compute_inference(mock_case, prec_feats)

    # High similarity (0.90) and agreement (0.90) should reduce delay
    assert pred_days < 150.0
    assert priority_score > 50.0
    assert len(shap_factors) == 3
    assert any("reduces_delay" == f.impact for f in shap_factors)
