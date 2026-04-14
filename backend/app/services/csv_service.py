from io import BytesIO, StringIO
from typing import Any
from uuid import UUID

import pandas as pd
from sqlmodel import Session, select

from app.models.entities import Applicant, ApplicantImport, Resume
from app.schemas.contracts import CSV_INPUT_COLUMNS, CSV_OUTPUT_COLUMNS


def _clean(value: Any) -> Any:
    if pd.isna(value):
        return None
    return value


def import_applicant_csv(session: Session, *, data: bytes, file_name: str, job_id: UUID) -> tuple[ApplicantImport, list[UUID]]:
    df = pd.read_csv(BytesIO(data), dtype=str).where(pd.notnull, None)
    import_record = ApplicantImport(job_id=job_id, file_name=file_name, row_count=len(df), status="imported")
    session.add(import_record)
    session.flush()
    applicant_ids: list[UUID] = []

    for _, row in df.iterrows():
        original = {column: _clean(row.get(column)) for column in df.columns}
        application_id = original.get("application_id")
        applicant = None
        if application_id:
            applicant = session.exec(select(Applicant).where(Applicant.application_id == application_id)).first()
        if applicant:
            applicant.import_id = import_record.id
            applicant.original_data = {**(applicant.original_data or {}), **original}
            applicant.candidate_name = applicant.candidate_name or original.get("candidate_full_name") or original.get("sender_name")
            applicant.candidate_email = applicant.candidate_email or original.get("candidate_email_from_resume") or original.get("sender_email")
            applicant.applied_role = applicant.applied_role or original.get("final_position_applied") or original.get("position_applied_from_email")
            applicant.review_status = applicant.review_status or original.get("review_status")
            applicant.candidate_stage = applicant.candidate_stage or original.get("candidate_stage")
            applicant.processing_status = "queued"
            applicant.system_outputs = {**(applicant.system_outputs or {}), "resume_analysis_status": "queued"}
            session.add(applicant)
            session.flush()
            resume = session.exec(select(Resume).where(Resume.applicant_id == applicant.id)).first()
            if resume:
                resume.storage_link = resume.storage_link or original.get("resume_storage_link")
                resume.file_name = resume.file_name or original.get("selected_resume_file_name")
                resume.mime_type = resume.mime_type or original.get("selected_resume_mime_type")
                session.add(resume)
            else:
                session.add(
                    Resume(
                        applicant_id=applicant.id,
                        storage_link=original.get("resume_storage_link"),
                        file_name=original.get("selected_resume_file_name"),
                        mime_type=original.get("selected_resume_mime_type"),
                        extraction_status=original.get("extraction_status") or "pending",
                    )
                )
        else:
            applicant = Applicant(
                import_id=import_record.id,
                job_id=job_id,
                application_id=application_id,
                candidate_name=original.get("candidate_full_name") or original.get("sender_name"),
                candidate_email=original.get("candidate_email_from_resume") or original.get("sender_email"),
                applied_role=original.get("final_position_applied") or original.get("position_applied_from_email"),
                original_data=original,
                processing_status="queued",
                system_outputs={"resume_analysis_status": "queued"},
                review_status=original.get("review_status"),
                candidate_stage=original.get("candidate_stage"),
            )
            session.add(applicant)
            session.flush()
            session.add(
                Resume(
                    applicant_id=applicant.id,
                    storage_link=original.get("resume_storage_link"),
                    file_name=original.get("selected_resume_file_name"),
                    mime_type=original.get("selected_resume_mime_type"),
                    extraction_status=original.get("extraction_status") or "pending",
                )
            )
        applicant_ids.append(applicant.id)
    session.commit()
    session.refresh(import_record)
    return import_record, applicant_ids


def build_export_csv(session: Session, *, job_id: UUID, decision: str | None = None) -> str:
    query = select(Applicant).where(Applicant.job_id == job_id)
    applicants = session.exec(query).all()
    rows: list[dict[str, Any]] = []
    for applicant in applicants:
        outputs = applicant.system_outputs or {}
        if decision and outputs.get("final_candidate_decision") != decision:
            continue
        row = {column: applicant.original_data.get(column) for column in CSV_INPUT_COLUMNS}
        for column in CSV_OUTPUT_COLUMNS:
            value = outputs.get(column)
            if isinstance(value, list):
                value = "; ".join(str(item) for item in value)
            row[column] = value
        rows.append(row)
    buffer = StringIO()
    pd.DataFrame(rows, columns=CSV_INPUT_COLUMNS + CSV_OUTPUT_COLUMNS).to_csv(buffer, index=False)
    return buffer.getvalue()
