"""
app/repositories/cases_repo.py
──────────────────────────────
SQLAlchemy database repository for managing `pending_cases`.
"""
from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.models import PendingCase, CaseStatus, ComplexityClass
from app.schemas.cases import CaseCreateSchema, CaseUpdateSchema


class CasesRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, data: CaseCreateSchema) -> PendingCase:
        new_case = PendingCase(
            case_no=data.case_no,
            case_type=data.case_type,
            court=data.court,
            filing_date=data.filing_date,
            hearings_count=data.hearings_count,
            description=data.description,
            status=data.status,
        )
        self.db.add(new_case)
        self.db.commit()
        self.db.refresh(new_case)
        return new_case

    def get_by_id(self, case_id: UUID) -> Optional[PendingCase]:
        return self.db.query(PendingCase).filter(PendingCase.id == case_id).first()

    def get_by_case_no(self, case_no: str) -> Optional[PendingCase]:
        return self.db.query(PendingCase).filter(PendingCase.case_no == case_no).first()

    def list_all(
        self,
        court: Optional[str] = None,
        status: Optional[CaseStatus] = None,
        complexity: Optional[ComplexityClass] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[PendingCase]:
        query = self.db.query(PendingCase)

        if court:
            query = query.filter(PendingCase.court.ilike(f"%{court}%"))
        if status:
            query = query.filter(PendingCase.status == status)
        if complexity:
            query = query.filter(PendingCase.complexity == complexity)

        # Sort by priority score descending by default
        return (
            query.order_by(PendingCase.priority_score.desc().nullslast(), PendingCase.created_at.desc())
            .offset(offset)
            .limit(limit)
            .all()
        )

    def count(
        self,
        court: Optional[str] = None,
        status: Optional[CaseStatus] = None,
        complexity: Optional[ComplexityClass] = None,
    ) -> int:
        query = self.db.query(PendingCase)
        if court:
            query = query.filter(PendingCase.court.ilike(f"%{court}%"))
        if status:
            query = query.filter(PendingCase.status == status)
        if complexity:
            query = query.filter(PendingCase.complexity == complexity)
        return query.count()

    def update(self, case: PendingCase, update_data: CaseUpdateSchema) -> PendingCase:
        if update_data.court is not None:
            case.court = update_data.court
        if update_data.hearings_count is not None:
            case.hearings_count = update_data.hearings_count
        if update_data.description is not None:
            case.description = update_data.description
        if update_data.status is not None:
            case.status = update_data.status

        self.db.commit()
        self.db.refresh(case)
        return case

    def delete(self, case: PendingCase) -> None:
        self.db.delete(case)
        self.db.commit()
