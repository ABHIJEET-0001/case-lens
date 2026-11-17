"""
app/api/v1/cases.py
───────────────────
FastAPI router for Cases CRUD and Docket Management.
"""
from typing import Optional
from uuid import UUID
import io
import csv
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db.models import CaseStatus, ComplexityClass, PendingCase
from app.schemas.cases import (
    CaseCreateSchema,
    CaseUpdateSchema,
    CaseResponseSchema,
    CaseListResponseSchema,
)
from app.services.cases_service import CasesService

router = APIRouter(prefix="/cases", tags=["cases"])


@router.get(
    "/export/csv",
    summary="Export all registered active cases as CSV format",
)
def export_cases_csv(db: Session = Depends(get_db)):
    cases = db.query(PendingCase).order_by(PendingCase.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "case_no", "court", "case_type", "filing_date", "hearings_count",
        "status", "complexity", "predicted_days", "priority_score", "description"
    ])
    for c in cases:
        writer.writerow([
            c.case_no, c.court, c.case_type, c.filing_date, c.hearings_count,
            c.status.value if hasattr(c.status, "value") else str(c.status),
            c.complexity.value if hasattr(c.complexity, "value") else str(c.complexity),
            c.predicted_days, c.priority_score, c.description or ""
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="cases_export.csv"'},
    )


@router.post(
    "/import/csv",
    summary="Import multiple cases in bulk via CSV upload",
)
def import_cases_csv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
    contents = file.file.read().decode("utf-8")
    reader = csv.DictReader(io.StringIO(contents))
    imported_count = 0
    service = CasesService(db)
    for row in reader:
        case_no = row.get("case_no")
        if not case_no:
            continue
        try:
            filing_date_val = date.fromisoformat(row["filing_date"]) if "filing_date" in row and row["filing_date"] else date.today()
            schema = CaseCreateSchema(
                case_no=case_no,
                court=row.get("court", "Supreme Court of India"),
                case_type=row.get("case_type", "CRL.A"),
                filing_date=filing_date_val,
                hearings_count=int(row.get("hearings_count", 1)),
                description=row.get("description", "Bulk CSV imported matter"),
            )
            service.create_case(schema)
            imported_count += 1
        except Exception:
            pass
    return {"status": "success", "imported": imported_count}


@router.get(
    "/count",
    status_code=status.HTTP_200_OK,
    summary="Return total number of active cases in the docket",
)
def count_cases(db: Session = Depends(get_db)) -> dict:
    from sqlalchemy import func
    from app.db.models import PendingCase
    count = db.query(func.count(PendingCase.id)).scalar() or 0
    return {"count": count}


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
