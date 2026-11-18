"""
app/api/v1/judge.py
────────────────────
Judge-only endpoints: approve a pending case and record it in the DB.
"""
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.v1.auth import require_role
from app.db.session import get_db
from app.db.models import PendingCase, CaseStatus, User

router = APIRouter(prefix="/judge", tags=["judge"])


@router.post("/approve/{case_id}", summary="Judge approves / disposes a pending case")
def approve_case(
    case_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(["judge"])),
):
    case = db.query(PendingCase).filter(PendingCase.id == case_id).first()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    case.status = CaseStatus.disposed          # save approval/disposal to DB
    case.assigned_to = current_user.id
    case.prediction_updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(case)

    return {
        "msg": "Case approved and marked disposed",
        "case_id": str(case.id),
        "case_no": case.case_no,
        "approved_by": current_user.email,
        "approved_at": case.prediction_updated_at.isoformat(),
        "status": case.status.value,
    }
