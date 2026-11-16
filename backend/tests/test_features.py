"""
backend/tests/test_features.py
──────────────────────────────
Unit tests for precedent-strength feature engineering.
"""
from datetime import date
from ml.features import compute_precedent_features


def test_compute_precedent_features_empty():
    feats = compute_precedent_features([])
    assert feats["top1_similarity"] == 0.0
    assert feats["mean_top5_similarity"] == 0.0
    assert feats["count_above_threshold"] == 0
    assert feats["outcome_agreement"] == 0.5


def test_compute_precedent_features_populated():
    mock_precedents = [
        {"similarity_score": 0.88, "judgment_date": "2023-01-01", "outcome": "Allowed"},
        {"similarity_score": 0.82, "judgment_date": "2022-06-15", "outcome": "Allowed"},
        {"similarity_score": 0.75, "judgment_date": "2021-03-20", "outcome": "Dismissed"},
        {"similarity_score": 0.68, "judgment_date": "2020-11-10", "outcome": "Allowed"},
        {"similarity_score": 0.60, "judgment_date": "2019-08-05", "outcome": "Dismissed"},
    ]

    feats = compute_precedent_features(mock_precedents, threshold=0.65, reference_date=date(2024, 1, 1))

    assert feats["top1_similarity"] == 0.88
    assert 0.70 < feats["mean_top5_similarity"] < 0.80
    assert feats["count_above_threshold"] == 4  # 0.88, 0.82, 0.75, 0.68 >= 0.65
    assert feats["outcome_agreement"] == 0.6  # 3 out of 5 Allowed = 60%
    assert feats["precedent_age_mean"] > 1.0
