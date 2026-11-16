"""
ml/features.py
──────────────
Precedent-strength feature engineering module for CaseLens.

Transforms vector search results (top-k precedents from FAISS) into
quantitative input signals for the time-to-resolution regression model:
  1. top1_similarity: Cosine similarity of the single closest precedent
  2. mean_top5_similarity: Average similarity of the top-5 retrieved judgments
  3. count_above_threshold: Number of precedent judgments with similarity >= 0.65
  4. similarity_spread: Standard deviation of top-5 similarities (indicates ambiguity)
  5. precedent_age_mean: Average age in years of retrieved precedents
  6. outcome_agreement: Ratio of top precedents sharing the consensus outcome
"""
from datetime import date, datetime
from typing import List, Dict, Any, Optional
import numpy as np


def compute_precedent_features(
    retrieved_precedents: List[Dict[str, Any]],
    threshold: float = 0.65,
    reference_date: Optional[date] = None,
) -> Dict[str, float]:
    """
    Given a list of retrieved precedent dicts (each having similarity_score,
    judgment_date, and outcome), compute the 6 precedent-strength features.
    """
    if not reference_date:
        reference_date = date.today()

    if not retrieved_precedents:
        return {
            "top1_similarity": 0.0,
            "mean_top5_similarity": 0.0,
            "count_above_threshold": 0,
            "similarity_spread": 0.0,
            "precedent_age_mean": 5.0,  # default 5 years
            "outcome_agreement": 0.5,   # default neutral
        }

    # Extract similarity scores
    sims = [float(p.get("similarity_score", 0.0)) for p in retrieved_precedents]
    sims_top5 = sims[:5]

    top1 = sims[0] if sims else 0.0
    mean_top5 = float(np.mean(sims_top5)) if sims_top5 else 0.0
    above_thresh = sum(1 for s in sims if s >= threshold)
    spread = float(np.std(sims_top5)) if len(sims_top5) > 1 else 0.0

    # Precedent age calculation
    ages = []
    for p in retrieved_precedents[:5]:
        j_date = p.get("judgment_date")
        if isinstance(j_date, str):
            try:
                j_date = datetime.strptime(j_date, "%Y-%m-%d").date()
            except ValueError:
                j_date = None

        if isinstance(j_date, date):
            diff_years = max(0.1, (reference_date - j_date).days / 365.25)
            ages.append(diff_years)
        else:
            ages.append(4.0)

    age_mean = float(np.mean(ages)) if ages else 5.0

    # Outcome agreement calculation
    outcomes = [
        str(p.get("outcome", "")).strip().lower()
        for p in retrieved_precedents[:5]
        if p.get("outcome")
    ]
    if outcomes:
        allowed_count = sum(1 for o in outcomes if "allow" in o or "quash" in o)
        dismissed_count = sum(1 for o in outcomes if "dismiss" in o)
        majority = max(allowed_count, dismissed_count)
        outcome_agreement = float(majority / len(outcomes))
    else:
        outcome_agreement = 0.5

    return {
        "top1_similarity": round(top1, 4),
        "mean_top5_similarity": round(mean_top5, 4),
        "count_above_threshold": int(above_thresh),
        "similarity_spread": round(spread, 4),
        "precedent_age_mean": round(age_mean, 2),
        "outcome_agreement": round(outcome_agreement, 4),
    }
