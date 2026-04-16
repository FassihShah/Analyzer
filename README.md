# AI Resume Filtering and Candidate Evaluation System

This repository contains a production-oriented scaffold for an internal recruiter/admin system that evaluates applicants with a multi-pass, rubric-driven DeepSeek pipeline. It is not a keyword ATS and it does not use a single resume prompt for the final decision.

## Architecture

- Frontend: Next.js 16, TypeScript, React 19, Tailwind CSS, lightweight shadcn-style UI primitives.
- Backend: FastAPI, SQLModel, PostgreSQL, Pydantic validation.
- Async processing: Celery with Redis.
- Resume parsing: PyMuPDF first, pdfplumber fallback, python-docx for DOCX. OCR is detected as required when text extraction fails.
- LLM: DeepSeek chat completions with JSON mode, retries, schema validation, coded prompt/rubric defaults, token usage storage, and failure logging.
- CSV: pandas import/export. The export preserves the existing applicant columns and adds only the requested recruiter-facing output columns.

## Multi-Pass Evaluation Flow

1. Fetch and parse the resume from `resume_storage_link`.
2. Generate a structured candidate profile JSON from the extracted resume.
3. Run specialized LLM passes using backend-coded detailed prompts and default rubrics:
   - project analysis
   - project complexity
   - ownership / role
   - skill relevance
   - experience depth
   - education relevance
   - communication clarity
   - growth potential
4. Compute a controlled weighted score from rubric weights.
5. Run final synthesis using the specialized pass outputs, not the raw resume as a one-shot decision.
6. Store the full evidence trail in PostgreSQL and write only the ten operational output fields to CSV export.

## Required Environment

Copy `.env.example` to `.env` and set:

```bash
DATABASE_URL=postgresql+psycopg://USER:PASSWORD@HOST/DB?sslmode=require
DEEPSEEK_API_KEY=...
SECRET_KEY=...
```

`DATABASE_URL` should point to your Neon PostgreSQL database. Keep `sslmode=require` in the URL.

For rejection email sending, also set SMTP values for the recruiter mailbox:

```bash
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USERNAME=hr@yourdomain.com
SMTP_PASSWORD=...
SMTP_USE_SSL=true
SMTP_USE_STARTTLS=false
RECRUITER_FROM_EMAIL=hr@yourdomain.com
RECRUITER_FROM_NAME=HR Team
```

Use the real mailbox address and password or app password from your email provider. The app drafts emails before sending, and only candidates with a completed `reject` decision for the selected job are eligible.

## Run With Docker

```bash
docker compose up --build
```

This starts the app, worker, frontend, and local Redis. PostgreSQL is expected to be Neon via `DATABASE_URL`.

If you need the old local Postgres container for development, run:

```bash
docker compose --profile local-db up --build
```

and use:

```bash
DATABASE_URL=postgresql+psycopg://resume:resume@postgres:5432/resume_filter
```

The backend seeds:

- Admin user: `admin@example.com`
- Password: `admin123`
- Sample job profile and prompt templates

Open:

- Frontend: `http://localhost:3000`
- Backend docs: `http://localhost:8000/docs`

## Local Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed
uvicorn app.main:app --reload
```

Run a worker:

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

## CSV Output Contract

The exported CSV only adds these system-generated columns:

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

Raw LLM responses, pass-by-pass analysis, prompt versions, model metadata, token usage, parsing diagnostics, audit logs, and structured candidate profiles are stored in the database and shown in the frontend candidate detail page.

## Notes

- The sample CSV uses an example resume URL and will not process until replaced with a real reachable PDF or DOCX link.
- OCR execution is intentionally conservative in this scaffold: scanned resumes are detected and marked for OCR instead of silently producing weak text.
- Prompt templates and scoring rubrics are code-managed so the recruiter UI stays simple. Recruiters configure the job profile, role expectations, skills, project types, ownership expectations, and experience depth.
