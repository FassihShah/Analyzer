# AI Resume Filtering System Flow

## Quick Summary

The system helps recruiters screen candidates with structured evidence instead of keyword-only matching. It imports flexible CSV files, parses resumes, evaluates candidates against a selected job profile, stores role-specific analysis, and prepares reviewed rejection emails for candidates who are not a fit.

The live deployment is on AWS EC2 using Docker Compose. The EC2 host runs the frontend, FastAPI backend, Celery worker, and Redis container. PostgreSQL is supplied by `DATABASE_URL`, normally an external managed database such as Neon. A local PostgreSQL container exists only for the optional development profile.

## Runtime Components

- Frontend: Next.js recruiter dashboard.
- Backend: FastAPI API, auth, business logic, and startup recovery.
- Worker: Celery worker consuming the `analysis` queue.
- Database: PostgreSQL through `DATABASE_URL`.
- Queue: Redis from Docker Compose.
- AI provider: DeepSeek chat completions in JSON mode.
- Resume parser: PyMuPDF, pdfplumber fallback, and python-docx.
- Email provider: SMTP sending with optional IMAP Sent-folder copy.

## Main User Flow

1. Recruiter signs in.
2. Recruiter creates a job profile, optionally from a pasted job description.
3. Recruiter uploads a CSV and selects the target job.
4. The backend stores original CSV data and maps common fields.
5. Applicants are deduplicated.
6. Applicants whose applied role matches the selected job are queued.
7. Applicants whose applied role does not match are marked `role_mismatch`.
8. Worker downloads and parses each resume.
9. AI creates a structured candidate profile.
10. AI evaluates all enabled dimensions in a batched request by default.
11. AI final synthesis produces score, decision, rationale, strengths, gaps, and interview focus areas.
12. Recruiter reviews dashboard, imports, applicants, applicant detail, analytics, emails, and exports.
13. Recruiter may re-run applicants or analyze matching applicants for another job.
14. Recruiter drafts rejection emails for completed rejected candidates.
15. Recruiter reviews, edits, sends, and tracks emails.
16. Recruiter exports enriched CSV results.

## 1. Authentication

The backend uses JWT bearer authentication.

The seed script creates:

- Email: `admin@example.com`
- Password: `admin123`

The frontend stores the token in browser local storage under `resume_filter_token`. API calls include the token as `Authorization: Bearer <token>`. Failed or expired auth redirects the user to `/login`.

Production note: replace or change the seeded admin credentials before real use.

## 2. Job Profile Creation

The recruiter can paste a raw job description. The backend asks DeepSeek to convert it into an editable profile. If AI drafting fails, a local fallback draft is generated.

The saved job profile includes:

- title
- department
- employment type
- role level
- location
- status: `draft`, `active`, or `archived`
- description
- summary
- success definition
- responsibilities
- practical capabilities
- requirements JSON
- decision thresholds
- prompt controls

When a job is created without explicit rubrics, the backend creates default rubrics for the standard dimensions.

Default thresholds:

- shortlist: 75
- review: 55
- reject: 0

## 3. Prompt And Rubric Setup

The seed script creates or updates prompt templates for:

- `candidate_profile`
- each evaluation dimension
- `final_synthesis`

Prompt versions are stored in the database. The current active prompt version is used during analysis.

Rubrics are stored per job and include:

- dimension name
- weight
- instructions
- low/mid/high descriptions
- red flag guidance
- confidence guidance
- enabled flag
- version

The recruiter UI intentionally keeps prompt/rubric controls simple. Most prompt behavior is code-managed and seeded by the backend.

## 4. CSV Import

The recruiter uploads a CSV and selects the job profile to analyze against.

The importer:

- creates an `ApplicantImport` record
- reads the CSV with pandas
- preserves each original row
- maps common source headers into canonical fields
- stores `_canonical_import` and `_column_mapping` inside `original_data`
- creates or reuses applicants
- creates or updates each applicant's resume record
- sets initial status to `queued`

Common mapped fields:

- application ID
- candidate name
- candidate email
- candidate phone
- applied role
- applied/received date
- resume link
- LinkedIn/profile URL
- employment status
- resume filename
- resume MIME type
- review status
- candidate stage

If no applied-role column exists, the selected job title is used as the applicant's applied role. This supports single-job CSV files.

If an applied-role column exists, the applicant must match the selected job before analysis is queued.

## 5. Deduplication

The importer reuses an existing applicant in this order:

1. Existing `application_id`.
2. Existing candidate email for the same selected job.
3. Existing candidate email plus the same applied role.

When reusing an applicant, the importer merges the new row into `original_data`, keeps existing identity fields when already present, updates the import link, updates resume fields if missing, and queues analysis.

This avoids duplicates when the same CSV is uploaded again while still allowing the same candidate to be considered for separate roles when appropriate.

## 6. Role Matching Safeguard

Before analysis is queued, the backend checks whether the applicant's stored role matches the selected job.

Role values can come from:

- `Applicant.applied_role`
- `final_position_applied`
- `position_applied_from_email`
- `position`
- `job_title`
- `role`

The matcher:

- normalizes text to lowercase tokens
- removes role stop words such as `job`, `role`, `position`, and `opening`
- accepts exact normalized title matches
- accepts token overlap of at least 75% of the smaller token set

If a candidate applied for `AI Developer` and the recruiter selects `Web Developer`, the applicant is marked `role_mismatch` and is not analyzed for the wrong job.

This safeguard also applies when drafting rejection emails.

## 7. Import Progress, Pause, Resume, And Delete

Import progress shows:

- total applicants
- done count
- percentage complete
- status counts
- applicant names
- applicant statuses
- score and decision when available
- role mismatch reason when present

Statuses include:

- `pending`
- `queued`
- `running`
- `completed`
- `failed`
- `missing_resume`
- `role_mismatch`

Pause behavior:

- The import status becomes `paused`.
- Already-running work may finish.
- Queued applicants stay queued but the worker does not start them while the import is paused.

Resume behavior:

- The import status returns to `imported`.
- Queued applicants are dispatched again.

Delete behavior:

- Deleting an import deletes the import record.
- It also deletes applicants from that import and their resume, profile, evaluation run, dimension, and final evaluation rows.

## 8. Resume Download And Parsing

Each applicant has a `Resume` record.

The worker fetches the resume from `resume.storage_link`. Supported links include:

- direct PDF links
- direct DOCX links
- Google Drive file links that can be converted to `uc?export=download&id=...`
- links whose content bytes reveal PDF or DOCX even when filename/content type is unclear

PDF parsing:

1. Try PyMuPDF.
2. If no text is found or parsing fails, try pdfplumber.
3. If still unreadable, mark OCR as required and fail the resume extraction.

DOCX parsing uses python-docx.

Failure behavior:

- Missing resume link becomes `missing_resume`.
- Unsupported or unreadable files become `failed`.
- The system does not invent resume information when parsing fails.

## 9. Structured Candidate Profile

The first AI analysis step turns resume text into structured JSON.

The profile may include:

- candidate name
- headline
- education entries
- experience entries
- projects
- skills
- tools and platforms
- inferred domains
- certifications
- achievements
- seniority indicators
- ownership indicators
- project evidence snippets
- ambiguity flags
- confidence

This step organizes evidence only. It does not make the hiring decision.

If DeepSeek returns malformed JSON, the backend creates a conservative fallback profile from parsed resume text. The fallback extracts obvious names, skills, projects, experience hints, domains, and evidence snippets, then marks the profile with low confidence.

## 10. Batched Multi-Dimension Evaluation

The normal evaluation path uses a single batched DeepSeek request for all enabled dimensions.

Default dimensions:

- `project_analysis`
- `project_complexity`
- `ownership`
- `skill_relevance`
- `experience_depth`
- `education_relevance`
- `communication_clarity`
- `growth_potential`

Each dimension result stores:

- score from 0 to 10
- confidence from 0 to 1
- reasoning
- evidence
- red flags
- missing information
- relevance to the job
- dimension-specific fields, such as projects, ownership category, or inferred level
- token usage
- raw AI response

The code can still run separate dimension calls if `job.prompt_controls.separate_dimension_calls` is set, but this is not the default path.

## 11. Weighted Score And Final Synthesis

After dimension analysis, the backend computes a controlled weighted score from the stored dimension scores and job rubric weights.

Default rubric weights emphasize:

- skill relevance
- project analysis
- ownership
- project complexity
- experience depth

Education and communication clarity are intentionally lighter signals.

The final synthesis prompt receives:

- structured candidate profile
- job profile and thresholds
- dimension results
- controlled weighted score

Final evaluation stores:

- final score
- final confidence
- decision
- interview recommendation
- summary
- strengths
- gaps
- best project relevance
- interview focus areas
- red flags
- missing information
- synthesis JSON

The final decision is one of:

- `shortlist`
- `review`
- `reject`

If the AI returns an invalid decision value, the backend falls back to the job thresholds.

## 12. Applicant Review

The Applicants page supports:

- filtering by decision
- filtering by job analysis
- filtering by processing status
- searching by name, email, skill, or strength
- selecting all visible applicants
- re-running selected applicants
- deleting selected applicants
- analyzing selected applicants for a selected job
- drafting rejection emails for selected candidates and selected job

The table shows:

- candidate name and email
- applied role
- score
- decision
- processing status
- best project relevance
- top strengths

## 13. Applicant Detail

The applicant detail page shows:

- role-specific analysis selector
- score, decision, and status for the selected role
- all known job analyses for the applicant
- role match/block status
- selected-role rationale
- selected-role dimension results
- resume parsing status and extracted text
- structured candidate profile
- original applicant data
- selected-role rejection email history
- other-role email history

Candidate profile and resume evidence are shared across role analyses. Scores, decisions, dimension results, and rejection email eligibility are role-specific.

## 14. Analyze Same Applicant For Another Job

Recruiters can analyze:

- a full import batch for another job
- selected applicants for another job
- one applicant from the detail page

The same applicant can have multiple `EvaluationRun` records, one per job. The detail page lets the recruiter choose which role analysis to inspect.

The role matching safeguard still applies. The system avoids analyzing an applicant for a job that does not match the applicant's applied role unless the role titles match under the token-overlap rule.

If `force` is true, existing analysis for that applicant and selected job is cleared before queuing a new run.

## 15. Reprocessing

Reprocessing one applicant or a selected batch:

- clears previous analysis rows
- clears candidate profiles
- queues the applicant again
- reuses existing resume text when already extracted

Single-job forced analysis clears only the analysis rows for that applicant and target job.

## 16. Recovery After Restart

On backend startup, recovery runs automatically.

It:

- finds applicants stuck in `running`
- sets them back to `queued`
- marks their running evaluation runs as `failed` with an interruption reason
- dispatches all queued applicants to Celery

This helps long-running batches recover after backend or worker restart.

## 17. Rejection Email Drafting

A rejection email draft can be created only when:

- applicant has an email address
- recruiter selected a specific job
- applicant's applied role matches that job
- applicant has a completed analysis for that job
- final decision for that job is `reject`

This prevents sending rejection emails for:

- unanalyzed applicants
- candidates analyzed only for another role
- shortlisted candidates
- manual review candidates
- candidates without email addresses
- role-mismatched applicants

The email generator uses:

- candidate name and email
- applied role
- selected job title and requirements
- final evaluation summary
- strengths
- gaps
- red flags and missing information
- lowest-scoring dimensions
- structured candidate profile

The generated email must not mention AI, internal scores, algorithms, or rubrics.

## 18. Email Review, Sending, And Tracking

Emails are stored before sending.

Statuses:

- `draft`: generated and editable
- `sent`: SMTP send succeeded
- `failed`: send attempt failed

Recruiters can:

- filter emails by job
- filter by status
- search by candidate, email, job, or subject
- review and edit draft subject/body
- send one draft
- send selected drafts in bulk

Sending behavior:

- SMTP is used to send the email.
- If enabled, IMAP is used to append a copy to the Sent folder.
- If SMTP succeeds but Sent-folder copy fails, status remains `sent` and the warning is stored in `failure_reason`.

## 19. Dashboard And Analytics

Dashboard metrics:

- imported applicants
- shortlisted candidates
- manual review candidates
- rejected candidates
- failed analyses
- email drafts

Dashboard lists:

- recent jobs
- recent applicants

Analytics shows:

- average final score
- scored candidates
- imported candidates

## 20. Export

The Exports page downloads CSV output by job, optionally filtered by decision.

Export preserves original applicant columns and adds these ten system fields:

- `resume_analysis_status`
- `final_candidate_score`
- `final_candidate_decision`
- `candidate_fit_summary`
- `top_strengths`
- `top_gaps`
- `best_project_relevance`
- `interview_recommendation`
- `interview_focus_areas`
- `ai_notes`

Raw AI responses, token usage, prompt versions, parser diagnostics, structured profiles, dimension results, and final evaluation rows remain in PostgreSQL and are not included in the recruiter CSV export.

## 21. EC2 Deployment Flow

The current deployment model is:

1. EC2 host has Docker and Docker Compose installed.
2. Repository is cloned on the EC2 host.
3. `.env` is created with production values.
4. Docker Compose starts Redis, backend, worker, and frontend.
5. Backend seeds database and starts FastAPI on port `8000`.
6. Worker starts Celery on queue `analysis`.
7. Frontend starts Next.js on port `3000`.

Current public endpoints, if using raw ports:

- Frontend: `http://EC2_HOST:3000`
- Backend API: `http://EC2_HOST:8000/api`
- Backend docs: `http://EC2_HOST:8000/docs`
- Health: `http://EC2_HOST:8000/health`

Important EC2 settings:

- `NEXT_PUBLIC_API_BASE_URL` must point to the public backend API URL.
- `CORS_ORIGINS` must include the public frontend URL.
- The EC2 security group must allow the chosen public frontend/API ports.
- Redis port `6379` should not be open publicly.
- For production public use, put the app behind HTTPS with a reverse proxy or load balancer.

Useful commands:

```bash
docker compose up --build -d
docker compose ps
docker compose logs --tail=120 backend
docker compose logs --tail=120 worker
docker compose restart backend worker
```

## 22. Data Model Overview

Core tables:

- `User`: admin/recruiter login.
- `JobProfile`: job configuration.
- `JobRubric`: per-job scoring dimensions and weights.
- `PromptTemplate` and `PromptTemplateVersion`: AI prompts.
- `ApplicantImport`: uploaded CSV batch.
- `Applicant`: candidate/application row.
- `Resume`: resume source, text, and parser diagnostics.
- `CandidateProfile`: structured resume evidence.
- `EvaluationRun`: one analysis run for one applicant/job.
- `EvaluationDimensionResult`: dimension-level result for a run.
- `FinalEvaluation`: final score and decision for a run.
- `CandidateEmail`: rejection email draft/send tracking.
- `AuditLog`: currently modeled for audit events.

## 23. Current Implementation Notes

- Migrations exist, but Docker startup currently calls `SQLModel.metadata.create_all` through `app.seed`; it does not run Alembic automatically.
- `init_db` also patches the PostgreSQL enum to include `queued` when needed.
- Frontend Docker currently runs the Next.js dev server through `npm run dev`.
- OCR packages are present in the image, but the current parser detects OCR need rather than executing OCR.
- Candidate email rows are modeled separately and are not explicitly removed by `delete_applicant_tree` or `delete_import_tree`; deletion can need email cleanup if drafts/sent emails exist for those applicants.
- Deleting a job deletes the job and rubrics only; avoid deleting jobs that still have applicant/evaluation history unless data cleanup is planned.
- Rejection email generation falls back to an error if DeepSeek email drafting fails; sending uses SMTP only after a draft is stored and reviewed.
