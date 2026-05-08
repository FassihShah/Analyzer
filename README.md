# AI Resume Filtering and Candidate Evaluation System

This repository contains an internal recruiter/admin system for importing applicants, parsing resumes, evaluating candidates against job-specific criteria, and preparing rejection emails for reviewed candidates.

The application is deployed on AWS EC2 with Docker Compose. The current Compose stack runs the frontend, backend API, Celery worker, and Redis on the EC2 host. PostgreSQL is configured through `DATABASE_URL`; in the current production-style setup this should point to the external managed PostgreSQL database, such as Neon. A local PostgreSQL container is available only through the optional `local-db` profile for development fallback.

## What The System Does

- Creates editable job profiles, with optional AI drafting from a pasted job description.
- Imports applicant CSV files with flexible column names.
- Preserves original CSV fields while normalizing the fields needed for analysis.
- Prevents common duplicate applicants with `application_id`, candidate email, job, and applied-role matching.
- Blocks analysis for rows whose applied role does not match the selected job.
- Downloads PDF and DOCX resumes from direct links and supported Google Drive links.
- Extracts resume text with PyMuPDF, pdfplumber fallback, and python-docx.
- Builds a structured candidate profile from resume evidence.
- Runs a multi-dimension AI evaluation, batched by default to reduce LLM calls.
- Produces a weighted final score, decision, strengths, gaps, rationale, and interview focus areas.
- Supports re-running applicants and analyzing the same applicant for matching job profiles.
- Drafts AI-personalized rejection emails only for completed rejected candidates for the selected job.
- Lets recruiters review, edit, send, and track candidate emails.
- Exports enriched CSV files with the original input fields plus recruiter-facing AI output columns.

## Architecture

- Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, lucide-react icons, lightweight local UI components.
- Backend: FastAPI, SQLModel, Pydantic, JWT auth, PostgreSQL.
- Worker: Celery worker on the `analysis` queue.
- Queue/cache: Redis container from Docker Compose.
- Database: PostgreSQL from `DATABASE_URL`; optional local Postgres profile for development.
- LLM provider: DeepSeek chat completions with JSON mode, retries, Pydantic validation, and token/raw-response storage.
- Resume parsing: PyMuPDF first, pdfplumber fallback, python-docx for DOCX. OCR need is detected when PDF text extraction fails.
- Email: SMTP sending with optional IMAP Sent-folder copy.

## Main Flow

1. Admin signs in with the seeded account.
2. Recruiter creates or edits a job profile.
3. Recruiter uploads a CSV and selects the target job.
4. The importer stores original row data, maps known columns, deduplicates applicants, and queues matching rows.
5. Rows with a different applied role are marked `role_mismatch` and are not analyzed for the wrong job.
6. Celery downloads and parses each resume.
7. DeepSeek creates a structured candidate profile.
8. DeepSeek evaluates the enabled dimensions in one batched request by default.
9. Final synthesis produces the score, decision, summary, strengths, gaps, and interview focus areas.
10. Recruiter reviews applicants, details, dimensions, and role-specific analyses.
11. Recruiter drafts rejection emails only for completed `reject` decisions for the selected matching job.
12. Recruiter reviews/edits drafts, sends one or many, and tracks `draft`, `sent`, or `failed` status.
13. Recruiter exports enriched CSV results by job and optional decision.

## Required Environment

Copy `.env.example` to `.env` and fill production values on the EC2 host:

```bash
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DB?sslmode=require
REDIS_URL=redis://redis:6379/0
SECRET_KEY=replace-with-a-long-random-secret
DEEPSEEK_API_KEY=...
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEFAULT_DEEPSEEK_MODEL=deepseek-chat
CORS_ORIGINS=http://YOUR_EC2_PUBLIC_HOST:3000
NEXT_PUBLIC_API_BASE_URL=http://YOUR_EC2_PUBLIC_HOST:8000/api
```

For SMTP rejection emails:

```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=hr@yourdomain.com
SMTP_PASSWORD=...
SMTP_USE_SSL=true
SMTP_USE_STARTTLS=false
RECRUITER_FROM_EMAIL=hr@yourdomain.com
RECRUITER_FROM_NAME=HR Team
IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
SAVE_SENT_EMAIL_COPY=true
SENT_MAILBOX_NAME=Sent
```

If the EC2 instance is behind Nginx, a load balancer, or a domain with HTTPS, set `CORS_ORIGINS` and `NEXT_PUBLIC_API_BASE_URL` to those public URLs instead of the raw EC2 host and ports.

## Run On AWS EC2

Install Docker and Docker Compose on the EC2 instance, clone the repository, create `.env`, then run:

```bash
docker compose up --build -d
```

Useful EC2 operations:

```bash
docker compose ps
docker compose logs --tail=120 backend
docker compose logs --tail=120 worker
docker compose restart backend worker
```

Current exposed ports:

- Frontend: `3000`
- Backend API: `8000`
- Redis: `6379`

For production, open only the required public ports in the EC2 security group. Redis should not be publicly exposed. Prefer a reverse proxy with TLS for public access.

The backend seeds the database on startup through `python -m app.seed` in Docker Compose:

- Admin user: `admin@example.com`
- Password: `admin123`
- Sample job profile: `AI Engineer Intern`
- Code-managed prompt templates and default rubrics

Change the seeded password or replace the seeded account before real production use.

## Run Locally With Docker

```bash
docker compose up --build
```

This starts Redis, backend, worker, and frontend. PostgreSQL still comes from `DATABASE_URL`.

To use the optional local PostgreSQL container:

```bash
docker compose --profile local-db up --build
```

Use this database URL for the local-db profile:

```bash
DATABASE_URL=postgresql+psycopg://resume:resume@postgres:5432/resume_filter
```

Open:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

## Local Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

Run the worker:

```bash
cd backend
celery -A app.workers.celery_app.celery_app worker -Q analysis --loglevel=INFO
```

## Local Frontend

```bash
cd frontend
npm install
npm run dev
```

## CSV Import

CSV import is not locked to one vendor format. The importer keeps original columns and maps common header variations into canonical fields.

Common mappings include:

- Application ID: `application_id`, `Application ID`, `Candidate ID`, `Submission ID`, `Response ID`
- Candidate name: `candidate_full_name`, `Name`, `Full Name`, `Applicant Name`, `Sender Name`
- Candidate email: `candidate_email_from_resume`, `Email`, `Email Address`, `Applicant Email`, `Sender Email`
- Candidate phone: `candidate_phone`, `Phone`, `Phone Number`, `Mobile`, `Contact Number`
- Applied role: `final_position_applied`, `Position Applied`, `Job Title`, `Position`, `Role`, `Opening`, `Vacancy`
- Applied date: `received_at`, `Applied Date`, `Application Date`, `Submitted At`, `Date Applied`
- Resume link: `resume_storage_link`, `Resume Link`, `Resume URL`, `CV Link`, `CV URL`, `Attachment Link`, `File URL`
- Profile/source fields such as `LinkedIn` and `Employment Status` are preserved and exported.

If a CSV has no applied-role column, the selected job title is stored as the applicant's applied role. If a CSV does include an applied-role column, only rows matching the selected job are queued. Non-matching rows are marked `role_mismatch`.

Role matching is conservative: normalized role tokens must match the selected job title exactly or overlap by at least 75% of the smaller token set.

## Evaluation Details

The default dimensions are:

- `project_analysis`
- `project_complexity`
- `ownership`
- `skill_relevance`
- `experience_depth`
- `education_relevance`
- `communication_clarity`
- `growth_potential`

By default, enabled dimensions are evaluated in one batched DeepSeek request. The code still supports separate dimension calls through job `prompt_controls.separate_dimension_calls`, but the normal path is batched.

Each dimension stores:

- score from 0 to 10
- confidence
- reasoning
- evidence
- red flags
- missing information
- job relevance

Final synthesis stores:

- final candidate score from 0 to 100
- final confidence
- decision: `shortlist`, `review`, or `reject`
- candidate fit summary
- strengths and gaps
- best project relevance
- interview recommendation and focus areas
- red flags, missing information, raw synthesis JSON, and token usage

## Export

Export preserves the applicant's original CSV columns and adds these ten system output fields:

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

Exports are available by job and can be filtered by decision.

## Operational Notes

- Startup recovery requeues applicants left in `running` status and dispatches queued applicants.
- Pausing an import stops queued work from starting, but an already-running candidate may finish.
- Reprocessing an applicant clears previous analysis data and queues the applicant again.
- Force-analyzing for a job clears only that applicant's analysis for that selected job.
- Deleting an import deletes the import's applicants and their related resume/profile/evaluation rows.
- Candidate email rows are not explicitly deleted by the current deletion service; delete flows can need cleanup if emails already exist for those applicants.
- Deleting a job removes the job and rubrics, but this code path does not cascade existing applicant/evaluation rows.
- The current frontend Dockerfile runs `npm run dev`. For a hardened production deployment, use a production Next.js build/start workflow and put the app behind HTTPS.
