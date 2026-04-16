# AI Resume Filtering System Flow

## Quick Summary

The system helps recruiters review applicants faster and more consistently.

It can:

- Create job profiles with AI help.
- Import applicants from CSV.
- Avoid duplicate candidates using `application_id`.
- Download and parse resumes.
- Analyze candidates against a selected job.
- Pause and resume analysis batches.
- Continue unfinished analysis after restart.
- Analyze the same candidates for more job titles later.
- Filter, review, re-run, delete, and export applicants.
- Draft AI-personalized rejection emails from job-specific weaknesses.
- Review, edit, send, and track rejection emails by applicant and role.

## High-Level Flow

1. Create a job profile.
2. Upload an applicant CSV.
3. Deduplicate applicants.
4. Queue the analysis batch.
5. Download and parse resumes.
6. Build structured candidate profiles.
7. Run batched multi-pass analysis.
8. Create final score and decision.
9. Review and filter applicants.
10. Analyze the same applicants for more job titles if needed.
11. Open an applicant and choose which job analysis to inspect.
12. Draft AI-personalized rejection emails for rejected candidates.
13. Review, edit, and send approved emails.
14. Track sent, failed, and drafted emails by applicant and role.
15. Export enriched results.

## 1. Job Profile Creation

The recruiter creates a job profile before importing applicants.

To make this simple, the recruiter can paste:

- job description
- responsibilities
- requirements
- hiring notes
- skills needed
- project expectations

The AI drafts a structured job profile from that text.

The recruiter can then edit and save it.

The job profile stores:

- job title
- department
- role level
- employment type
- location
- required skills
- preferred skills
- tools and platforms
- preferred project types
- expected experience depth
- education preferences
- communication expectations

Why this matters:

- The same candidate can score differently for different jobs.
- Each analysis is linked to a specific job title.
- If a job profile changes, selected applicants can be re-run.

## 2. Applicant CSV Import

The recruiter uploads a CSV and selects the job profile to analyze against.

The system:

- creates an import batch
- stores original CSV data
- creates applicants from CSV rows
- links each applicant to the import batch
- queues applicants for analysis

Deduplication:

- If a row has an `application_id` that already exists, the system reuses that applicant.
- This prevents duplicate candidates when the same file is uploaded again.
- It also helps when the same candidate pool is analyzed for another job later.

Import history lets the recruiter:

- view previous CSV batches
- check progress
- analyze a batch for another job
- delete an import batch and its related analysis data

## 3. Analysis Batch Progress

After import, applicants are analyzed in the background.

The progress screen shows:

- total applicants
- completed count
- queued count
- running count
- failed count
- missing resume count
- percentage completed
- job title used for the analysis

The recruiter can pause and resume a batch.

Pause behavior:

- It does not kill an applicant already inside an AI call.
- The currently running applicant may still finish.
- Remaining queued applicants wait.

Resume behavior:

- Queued applicants continue from where the batch stopped.
- The recruiter does not need to upload the CSV again.

## 4. Resume Download And Parsing

For each applicant, the system finds the resume link from the CSV data.

It supports:

- normal resume links
- Google Drive sharing links where possible
- PDF resumes
- DOCX resumes

The system extracts readable resume text.

Status handling:

- Missing resume link -> `missing_resume`
- Unreadable or failed resume -> `failed`
- Successful parsing -> analysis continues

The system does not invent resume information if the resume cannot be read.

## 5. Structured Candidate Profile

The first AI step converts resume text into a structured profile.

The profile can include:

- candidate name
- headline or summary
- skills
- tools and platforms
- projects
- project evidence snippets
- education entries
- experience entries
- achievements
- inferred domains
- ownership indicators
- seniority indicators
- ambiguity flags

This step only organizes evidence.

It does not make the final decision.

Empty-profile protection:

- If the AI returns an empty profile even though resume text exists, the system retries.
- If it is still empty, a fallback parser extracts obvious resume information.
- This prevents good candidates from being scored as zero because of an empty AI response.

## 6. Batched Multi-Pass Analysis

The system still evaluates candidates in multiple dimensions, but it reduces AI calls.

Instead of calling the AI separately for every dimension, the system normally sends one batched dimension-analysis request.

This keeps analysis detailed while making it faster.

Dimensions evaluated:

- project analysis
- project complexity
- ownership
- skill relevance
- experience depth
- education relevance
- communication clarity
- growth potential

Each dimension includes:

- score
- confidence
- reasoning
- evidence
- red flags
- missing information

Usual AI analysis flow:

1. Build structured candidate profile.
2. Run batched dimension analysis.
3. Produce final synthesis and decision.

## 7. Final Score And Decision

After dimension analysis, the system creates the final candidate result.

The final result includes:

- final candidate score
- shortlist, review, or reject decision
- candidate fit summary
- top strengths
- top gaps
- best project relevance
- interview recommendation
- interview focus areas
- AI notes or red flags

The score is weighted.

Higher-impact areas such as skills, projects, ownership, and experience matter more than lighter signals such as resume clarity.

## 8. Analyze Same Candidates For More Jobs

The recruiter does not need to import the same CSV again for another job.

They can:

- open an import batch
- choose another job title
- queue the same applicants for that job

They can also select applicants from the Applicants page and analyze only those selected applicants for another job.

The system stores job-specific analysis separately.

This means one candidate can have:

- score for Job A
- decision for Job A
- detailed dimension results for Job A
- final rationale for Job A
- score for Job B
- decision for Job B
- detailed dimension results for Job B
- final rationale for Job B

This avoids candidate duplication and supports multiple hiring roles from the same applicant pool.

## 9. Applicant Review

The Applicants page is the main recruiter review screen.

Recruiters can filter by:

- decision
- analysis job title
- processing status
- name
- email
- skill
- strength

Processing statuses:

- queued
- running
- completed
- failed
- missing resume

The page also shows:

- number of filtered applicants
- selected applicants in current filter
- total selected applicants

Selected applicants can be:

- re-run
- deleted
- analyzed for another job title
- drafted for rejection emails when they have a completed `reject` decision for the selected job

## 10. Applicant Detail Page

The applicant detail page shows deeper evidence.

It can show:

- resume parsing status
- parsed resume text
- structured candidate profile
- scores for each job title
- decisions for each job title
- a selected job-analysis dropdown
- selected job score
- selected job decision
- selected job final rationale
- selected job dimension-wise evaluations
- rejection email history for this applicant

This helps the recruiter understand why the system gave a score.

Selected-analysis behavior:

- The applicant can have many job analyses.
- The recruiter selects the job analysis they want to inspect.
- Score cards, decision, final rationale, and dimension results update to match the selected job.
- Draft rejection email uses the selected job analysis, not a random latest analysis.
- This prevents mixing the reasoning from one role with the email or decision for another role.

The rejection email history shows:

- job title or role
- email status: `draft`, `sent`, or `failed`
- recipient email
- sent timestamp
- last updated timestamp
- subject
- full drafted email body
- delivery or Sent-folder warning if one exists

This keeps the candidate communication trail visible from the applicant's own record, not only from the Emails page.

## 11. Dashboard And Analytics

The Dashboard gives a quick overview:

- total imported applicants
- shortlisted candidates
- manual review candidates
- rejected candidates
- failed analyses
- email drafts waiting for review
- recent jobs
- recent applicants

The Analytics page gives a lightweight scoring overview:

- average final score
- scored candidates
- imported candidates

## 12. Recovery After Restart

The system can recover unfinished work.

If the backend or worker stops during analysis:

- unfinished applicants can be returned to the queue
- stuck running applicants can continue after restart
- the recruiter does not need to re-import the CSV

This makes long analysis batches safer.

## 13. Export

When review is complete, the recruiter can export results as an enriched CSV.

The export keeps original applicant data and adds AI result fields.

Export fields can include:

- final score
- decision
- summary
- strengths
- gaps
- interview recommendation
- interview focus areas

## 14. Rejection Email Drafting, Sending, And Tracking

The recruiter can create AI-personalized rejection emails after analysis is complete.

Eligibility rules:

- The applicant must have an email address.
- The recruiter must choose a specific job title.
- The applicant must already have a completed analysis for that job title.
- The completed decision for that job must be `reject`.
- The draft must be reviewed before sending.

This prevents sending rejection emails for:

- candidates who were not analyzed yet
- candidates analyzed for a different job only
- shortlisted or review candidates
- applicants with missing email addresses

Recommended flow:

1. Filter Applicants by job title and `reject`.
2. Select one or more candidates.
3. Create AI-personalized rejection email drafts.
4. Open the Emails page.
5. Review and edit each draft if needed.
6. Send a single approved draft or send selected approved drafts in bulk.
7. Check status from the Emails page or the applicant detail page.

AI draft generation uses:

- candidate name
- selected job title
- final evaluation summary
- top candidate gaps
- lowest-scoring analysis dimensions
- missing information identified during evaluation
- candidate strengths where appropriate
- job requirements and success definition

The email draft should include:

- a clear but respectful rejection decision
- two or three constructive improvement areas
- humble, professional, and engaging wording
- one brief positive note when supported by evidence
- a polite closing from the recruiter

The email draft must not include:

- AI, algorithm, score, or rubric wording
- harsh language
- legal-risk wording
- unsupported claims
- promises about future opportunities

The system stores each email before sending.

Email statuses:

- `draft`: generated but not sent yet
- `sent`: delivered through SMTP
- `failed`: send attempt failed

Tracking surfaces:

- The Emails page shows all rejection emails across applicants.
- The Emails page tracks applicant, role, status, sent time, failure reason, and actions.
- The applicant detail page shows that applicant's full rejection email history and full draft body.

Delivery behavior:

- Emails are sent through the configured Hostinger SMTP mailbox.
- After SMTP delivery, the system tries to save a copy into the Hostinger Sent folder using IMAP.
- If SMTP succeeds but the Sent-folder copy fails, the email remains `sent`, and the warning is stored on the email record.
- Emails sent before Sent-folder copy support was added will not appear retroactively in Hostinger Sent.

Required email configuration:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `RECRUITER_FROM_EMAIL`
- `RECRUITER_FROM_NAME`
- `IMAP_HOST`
- `IMAP_PORT`
- `SAVE_SENT_EMAIL_COPY`
- `SENT_MAILBOX_NAME`

## Why Multi-Pass Analysis Matters

The system is not just doing keyword matching.

For example, if a resume mentions Python, AI, APIs, and databases, the system still checks:

- Were those skills used in real projects?
- Were the projects complex enough?
- Did the candidate personally own the work?
- Is the experience relevant to this job?
- Is there enough evidence to trust the claim?

That gives recruiters clearer reasoning behind each score and decision.

## Main Features

- AI-assisted job profile creation.
- Editable job profiles.
- CSV applicant import.
- Import history.
- `application_id` deduplication.
- Google Drive resume link handling.
- PDF and DOCX parsing.
- Structured candidate profile generation.
- Empty-profile retry and fallback extraction.
- Batched multi-pass analysis.
- Weighted final scoring.
- Shortlist, review, or reject decision.
- Pause and resume analysis batches.
- Recovery after backend or worker restart.
- Analyze same candidates for multiple jobs.
- Job-specific scores and decisions.
- Applicant detail selected-job analysis view.
- Job-specific dimension and rationale inspection from applicant detail.
- Applicant filtering by job, status, decision, and search.
- Selected applicant count while filtering.
- Re-run selected applicants.
- Delete selected applicants.
- Delete complete import batches.
- Applicant detail review.
- AI-personalized rejection email drafting for completed rejected job analyses.
- Single and bulk rejection email sending after draft review.
- Rejection email tracking by applicant, role, status, and sent timestamp.
- Applicant-level rejection email history with full drafted email body.
- Hostinger SMTP sending with optional IMAP Sent-folder copy.
- Dashboard overview.
- Analytics overview.
- Enriched CSV export.
