#!/usr/bin/env python
"""Admin utility to recompute precedent features for all persisted cases.
Runs with a fresh DB session; skips if DEMO_MODE is off. Logs warnings on failures.
"""
import logging
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.db.models import PendingCase, Judgment
from app.repositories.vector_index_repo import VectorIndexRepository

log = logging.getLogger("recompute")


def recompute():
    db: Session = SessionLocal()
    try:
        vector_repo = VectorIndexRepository.get_instance()
        if not vector_repo.is_ready:
            log.warning("FAISS index not ready – aborting recompute")
            return
        for case in db.query(PendingCase).all():
            # compute fresh similarity metrics
            matches = vector_repo.search_semantic(case.description, top_k=5)
            if matches:
                scores = [m[1] for m in matches]
                case.top1_similarity = round(float(scores[0]), 4)
                case.mean_top5_similarity = round(float(sum(scores) / len(scores)), 4)
                case.count_above_threshold = sum(1 for s in scores if s > 0.60)
            db.add(case)
        db.commit()
        log.info("Recomputed features for %d cases", db.query(PendingCase).count())
    finally:
        db.close()

if __name__ == "__main__":
    recompute()
