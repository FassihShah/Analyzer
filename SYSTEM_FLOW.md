# AI Resume Filtering System Flow

## Overview

This system helps recruiters review applicants consistently without manually reading every resume first. The recruiter creates a job profile, uploads an applicant CSV, the system reads each resume, analyzes every candidate against the selected job, and then shows ranked results for review.

The updated flow is:

AI-assisted job profile -> CSV import -> applicant deduplication -> resume download and parsing -> structured candidate profile -> batched multi-pass analysis -> final score and decision -> recruiter review -> optional analysis for more job titles -> export.

## How The System Works

### 1. Create A Job Profile

The recruiter first creates the job profile. This tells the system what kind of candidate it should look for.

Creating a job profile is made simple with AI help. The recruiter can paste a full job description, responsibilities, requirements, and hiring notes. The system then drafts an editable job profile from that text.

The recruiter can review the AI-filled profile, adjust anything that does not match the real hiring need, and then save it. This means the recruiter does not need to manually fill every structured field from scratch.

The job profile includes things like:

- job title
- department and role level
- required skills
- preferred skills
- preferred project types
- expected experience depth
- education preferences
- communication expectations
- what a strong candidate should look like

The job profile is important because the same candidate can be strong for one role and weak for another. The system now keeps track of which job title each analysis belongs to.

The recruiter can also edit or delete job profiles later. If a job profile changes, selected applicants can be re-run so their analysis reflects the updated role expectations.

### 2. Upload The Applicant CSV

The recruiter uploads a CSV and selects the first job profile to analyze against.

The system stores the import batch, keeps the original CSV data, and creates or updates applicants from the CSV rows.

If the same applicant already exists with the same `application_id`, the system reuses that applicant instead of creating a duplicate. This prevents candidate duplication when the same CSV is imported again or when the same candidate needs to be analyzed for another job later.

The import history screen keeps previous CSV batches visible. The recruiter can open a batch again, check its progress, analyze the same batch for another job, or delete the whole import batch and its related applicant analysis data when needed.

### 3. Queue The Analysis Batch

After import, the applicants are queued for analysis. The worker processes candidates in the background so the UI can stay responsive.

The import progress screen shows:

- total applicants
- completed applicants
- queued applicants
- running applicants
- failed applicants
- missing resume applicants
- overall progress percentage
- the job title used for the analysis

The recruiter can now pause and resume an analysis batch. Pause does not kill a candidate that is already inside an AI call, but it stops the remaining queued applicants from continuing. When the batch is resumed, the queued applicants continue from where the batch stopped.

The progress view also supports analyzing the same import for another job title later. This is useful when one candidate pool should be evaluated against multiple roles without uploading the CSV again.

### 4. Resume Download And Parsing

For each applicant, the system finds the resume link from the CSV data. If the link is a Google Drive sharing link, the system converts it into a direct download link where possible.

Then it downloads the resume and extracts readable text from PDF or DOCX files.

If the resume link is missing, the applicant is marked as `missing_resume`.

If the resume cannot be parsed or is unreadable, the analysis is marked as failed instead of inventing information.

### 5. Build A Structured Candidate Profile

The first analysis step turns the raw resume text into a structured candidate profile.

This profile contains:

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

This step does not make the final hiring decision. It only organizes the resume evidence so later scoring is based on clean candidate information instead of raw text.

If the AI returns an empty profile even though resume text exists, the system attempts to regenerate the profile. If that still fails, a fallback parser extracts obvious skills, projects, experience, and candidate information from the resume text so the candidate is not unfairly scored as empty.

### 6. Multi-Pass Analysis

The system uses multi-pass analysis, but it is now optimized to avoid too many AI calls.

Earlier, every scoring dimension could be a separate AI call. That was slower. Now the system normally sends the candidate profile and job profile into one batched dimension-analysis call, and the AI returns all dimension scores together.

The dimensions are still evaluated separately inside the result:

- project analysis
- project complexity
- ownership
- skill relevance
- experience depth
- education relevance
- communication clarity
- growth potential

Each dimension produces:

- score
- confidence
- reasoning
- evidence
- red flags
- missing information

This keeps the quality of multi-pass analysis while reducing the number of AI calls per applicant.

The usual analysis flow is now:

1. Build structured candidate profile.
2. Run batched dimension analysis.
3. Produce final synthesis and decision.

### 7. Weighted Score And Final Decision

After dimension analysis, the system combines the results into a final candidate evaluation.

More important areas, such as skill relevance, project quality, ownership, and experience depth, have more influence than lighter signals like resume clarity.

The final output includes:

- final candidate score
- shortlist, review, or reject decision
- candidate fit summary
- top strengths
- top gaps
- best project relevance
- interview recommendation
- interview focus areas
- AI notes or red flags

This final result is what the recruiter sees first in the applicants list.

### 8. Analyze The Same Import For More Job Titles

The recruiter does not need to import the same CSV again for another job.

From the import or applicant screens, the recruiter can select another job title and queue the same applicants for analysis against that job.

The system stores job-specific analysis separately, so one applicant can have scores for multiple job titles. In the applicant detail page, the recruiter can see which job titles the candidate has been analyzed for and compare the scores and decisions.

This avoids duplicate candidates and makes the system better for agencies or teams hiring for multiple roles at once.

The applicant detail page shows the candidate profile, resume parsing status, dimension-wise evaluations, final result, and job-specific analysis history. This helps the recruiter understand not only the final score, but also why the system reached that decision.

### 9. Review And Filter Applicants

The Applicants screen is used for recruiter review.

Recruiters can filter applicants by:

- decision
- analysis job title
- processing status
- name, email, skill, or strength

Processing status can be:

- queued
- running
- completed
- failed
- missing resume

The screen also shows how many applicants are currently filtered and how many are selected. This matters because the recruiter can select candidates in a filtered view and then re-run analysis, delete, or analyze those selected applicants for another job title.

The dashboard gives a quick overview of total imported applicants, shortlisted candidates, review candidates, rejected candidates, failed analyses, recent jobs, and recent applicants. The analytics screen gives a lightweight scoring overview, including average final score, scored candidates, and total imported candidates.

### 10. Recovery If Backend Or Worker Stops

The system is designed to continue after interruption.

If the backend or worker stops during analysis, applicants that were stuck in `running` or unfinished states can be recovered and returned to the queue when the system starts again.

This means the recruiter should not need to re-import the CSV after a restart. The system can continue from the remaining applicants instead of starting the entire batch again.

### 11. Export Results

When review is complete, the recruiter can export an enriched CSV.

The export preserves the original applicant data and adds AI-generated fields such as:

- final score
- decision
- summary
- strengths
- gaps
- interview recommendation
- interview focus areas

This makes the output usable outside the app while keeping the original CSV fields intact.

## Main Features

- AI-assisted job profile creation from pasted job descriptions.
- Editable job profiles after AI fills the first draft.
- CSV import for applicant data and resume links.
- Import history with progress tracking.
- Deduplication using `application_id`.
- Google Drive resume link handling.
- PDF and DOCX resume text extraction.
- Missing resume and failed analysis status handling.
- Structured candidate profile generation.
- Fallback extraction when the AI profile comes back empty.
- Batched multi-pass analysis to reduce AI calls while keeping separate scoring dimensions.
- Weighted final score and shortlist, review, or reject decision.
- Pause and resume for analysis batches.
- Recovery for interrupted analysis after backend or worker restart.
- Analyze the same import or selected applicants for additional job titles.
- Store and display job-specific analysis results for the same candidate.
- Filter applicants by decision, job title, status, and search text.
- Show selected applicant count while filtering.
- Re-run selected applicants.
- Delete selected applicants or complete import batches.
- Applicant detail page with resume parsing, structured profile, dimension results, and job analysis history.
- Dashboard for high-level applicant and job overview.
- Analytics page for scoring coverage and candidate volume.
- Enriched CSV export with original data plus AI results.

## Why Multiple Passes Matter

The multi-pass approach makes the evaluation more reliable than simple keyword matching.

For example, a resume may mention Python, AI, APIs, and databases. The system does not automatically treat that as a strong match. It separately checks whether those skills appear in real projects, whether the projects are complex, whether the candidate personally owned the work, and whether the experience is relevant to the target job.

This gives recruiters a clearer reason for every score and decision.

## Current Practical Behavior

- Importing a CSV starts analysis for the selected job.
- Job profiles can be created faster by pasting a job description and letting AI draft the structured profile.
- Duplicate applicants are avoided using `application_id`.
- Resume text is parsed before scoring.
- Empty AI profiles are retried or handled with fallback extraction.
- Dimension scoring is batched to reduce AI calls and speed up analysis.
- The same import can be analyzed later for more job titles.
- Applicant detail pages can show scores for different job titles.
- Applicants can be filtered by job title, status, decision, and search text.
- Selected applicant counts are visible while filtering.
- Analysis batches can be paused and resumed.
- Interrupted analysis can continue from unfinished applicants after restart.
- Results can be exported as an enriched CSV.
