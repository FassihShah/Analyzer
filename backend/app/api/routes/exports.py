from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlmodel import Session

from app.api.deps import get_current_user
from app.db.session import get_session
from app.models.entities import User
from app.services.csv_service import build_export_csv

router = APIRouter(prefix="/exports", tags=["exports"])


class SelectedExportRequest(BaseModel):
    applicant_ids: list[UUID]
    decision: str | None = None


def _csv_response(content: str) -> Response:
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="enriched_applicants.csv"'},
    )


@router.get("/csv")
def export_csv(
    job_id: UUID,
    decision: str | None = None,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    return _csv_response(build_export_csv(session, job_id=job_id, decision=decision))


@router.post("/csv/selected")
def export_selected_csv(
    payload: SelectedExportRequest,
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    if not payload.applicant_ids:
        raise HTTPException(status_code=400, detail="Select at least one applicant to export.")
    return _csv_response(build_export_csv(session, decision=payload.decision, applicant_ids=payload.applicant_ids))
