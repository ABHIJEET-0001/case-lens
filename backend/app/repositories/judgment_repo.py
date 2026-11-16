"""
app/repositories/judgment_repo.py
─────────────────────────────────
SQLAlchemy database queries for judgments and attached summaries.
"""
from typing import List, Optional, Dict
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import extract, or_

from app.db.models import Judgment, Summary
from app.schemas.search import SearchFilters


class JudgmentRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, judgment_id: UUID) -> Optional[Judgment]:
        return (
            self.db.query(Judgment)
            .options(joinedload(Judgment.summary))
            .filter(Judgment.id == judgment_id)
            .first()
        )

    def get_by_ids(
        self, judgment_ids: List[UUID], filters: Optional[SearchFilters] = None
    ) -> List[Judgment]:
        """
        Fetch judgments by IDs with optional metadata filtering.
        Eagerly loads cached summaries.
        """
        if not judgment_ids:
            return []

        query = (
            self.db.query(Judgment)
            .options(joinedload(Judgment.summary))
            .filter(Judgment.id.in_(judgment_ids))
        )

        if filters:
            if filters.court:
                query = query.filter(Judgment.court.ilike(f"%{filters.court}%"))
            if filters.case_type:
                query = query.filter(Judgment.case_type.ilike(f"%{filters.case_type}%"))
            if filters.year_from:
                query = query.filter(extract("year", Judgment.judgment_date) >= filters.year_from)
            if filters.year_to:
                query = query.filter(extract("year", Judgment.judgment_date) <= filters.year_to)
            if filters.outcome:
                query = query.filter(Judgment.outcome.ilike(f"%{filters.outcome}%"))

        return query.all()

    def get_all_indexed(self) -> List[Judgment]:
        """Return all judgments that have been indexed in the vector database."""
        return self.db.query(Judgment).filter(Judgment.is_indexed == True).all()
