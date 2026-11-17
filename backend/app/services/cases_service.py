"""
app/services/cases_service.py
─────────────────────────────
Service layer for pending cases registry management.
"""
from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.repositories.cases_repo import CasesRepository
from app.schemas.cases import (
    CaseCreateSchema,
    CaseUpdateSchema,
    CaseResponseSchema,
    CaseListResponseSchema,
)
from app.db.models import CaseStatus, ComplexityClass


class CasesService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = CasesRepository(db)

    def create_case(self, data: CaseCreateSchema) -> CaseResponseSchema:
        existing = self.repo.get_by_case_no(data.case_no)
        if existing:
            raise ValueError(f"Case with number '{data.case_no}' is already registered.")

        created = self.repo.create(data)

        # Trigger live precedent feature extraction & prediction
        try:
            from app.services.prediction_service import PredictionService
            pred_svc = PredictionService(self.db)
            pred_svc.predict_for_case(created.id)
            self.db.refresh(created)
        except Exception:
            pass

        return CaseResponseSchema.model_validate(created)

    def get_case_by_id(self, case_id: UUID) -> CaseResponseSchema:
        case = self.repo.get_by_id(case_id)
        if not case:
            raise ValueError(f"Case with ID '{case_id}' not found.")
        return CaseResponseSchema.model_validate(case)

    def list_cases(
        self,
        court: Optional[str] = None,
        status: Optional[CaseStatus] = None,
        complexity: Optional[ComplexityClass] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> CaseListResponseSchema:
        cases = self.repo.list_all(court, status, complexity, limit, offset)
        total = self.repo.count(court, status, complexity)

        return CaseListResponseSchema(
            total=total,
            cases=[CaseResponseSchema.model_validate(c) for c in cases],
        )

    def update_case(self, case_id: UUID, data: CaseUpdateSchema) -> CaseResponseSchema:
        case = self.repo.get_by_id(case_id)
        if not case:
            raise ValueError(f"Case with ID '{case_id}' not found.")

        updated = self.repo.update(case, data)

        # Re-compute features & prediction if relevant attributes changed
        if data.description or data.hearings_count is not None:
            try:
                from app.services.prediction_service import PredictionService
                pred_svc = PredictionService(self.db)
                pred_svc.predict_for_case(updated.id)
                self.db.refresh(updated)
            except Exception:
                pass

        return CaseResponseSchema.model_validate(updated)

    def delete_case(self, case_id: UUID) -> None:
        case = self.repo.get_by_id(case_id)
        if not case:
            raise ValueError(f"Case with ID '{case_id}' not found.")
        self.repo.delete(case)
