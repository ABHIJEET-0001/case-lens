"""
app/api/v1/cases.py
───────────────────
FastAPI router for Cases CRUD and Docket Management.
"""
from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import CaseStatus, ComplexityClass
from app.schemas.cases import (
    CaseCreateSchema,
    CaseUpdateSchema,
    CaseResponseSchema,
    CaseListResponseSchema,
)
from app.services.cases_service import CasesService

router = APIRouter(prefix="/cases", tags=["cases"])


@router.post(
    "",
    response_model=CaseResponseSchema,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new pending case in the court docket",
)
def create_case(
    case_in: CaseCreateSchema, db: Session = Depends(get_db)
) -> CaseResponseSchema:
    try:
        service = CasesService(db)
        return service.create_case(case_in)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err),
        )


@router.get(
    "",
    response_model=CaseListResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="List active pending cases with optional court, status, and complexity filters",
)
def list_cases(
    court: Optional[str] = Query(None, description="Filter by court name"),
    status: Optional[CaseStatus] = Query(None, description="Filter by case status stage"),
    complexity: Optional[ComplexityClass] = Query(None, description="Filter by complexity class"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> CaseListResponseSchema:
    service = CasesService(db)
    return service.list_cases(court, status, complexity, limit, offset)


@router.get(
    "/{case_id}",
    response_model=CaseResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Get full dossier and prediction metrics for a specific case",
)
def get_case(
    case_id: UUID, db: Session = Depends(get_db)
) -> CaseResponseSchema:
    try:
        service = CasesService(db)
        return service.get_case_by_id(case_id)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err),
        )


@router.patch(
    "/{case_id}",
    response_model=CaseResponseSchema,
    status_code=status.HTTP_200_OK,
    summary="Update case status, hearings count, or description",
)
def update_case(
    case_id: UUID, case_update: CaseUpdateSchema, db: Session = Depends(get_db)
) -> CaseResponseSchema:
    try:
        service = CasesService(db)
        return service.update_case(case_id, case_update)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err),
        )


@router.delete(
    "/{case_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Remove or archive a case from the registry",
)
def delete_case(
    case_id: UUID, db: Session = Depends(get_db)
) -> None:
    try:
        service = CasesService(db)
        service.delete_case(case_id)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(val_err),
        )
