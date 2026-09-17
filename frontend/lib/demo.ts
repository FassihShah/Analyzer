import type { Applicant, CandidateEmail, JobProfile } from "@/types/domain";

type DemoImport = {
  id: string;
  file_name: string;
  row_count: number;
  status: string;
  job_title?: string;
  job_id: string;
  applicant_count: number;
  counts: Record<string, number>;
  created_at: string;
  applicant_ids: string[];
};

type DemoStore = { jobs: JobProfile[]; applicants: Applicant[]; emails: CandidateEmail[]; imports: DemoImport[] };

const KEY = "dyos-portfolio-demo-v1";

const seedJobs: JobProfile[] = [
  { id: "job-product", title: "Senior Product Designer", department: "Product", employment_type: "Full-time", role_level: "Senior", location: "Remote", status: "active", summary: "Own complex workflow design from discovery through delivery.", requirements: { essential_skills: ["Product design", "Research", "Design systems"] } },
  { id: "job-engineer", title: "Frontend Engineer", department: "Engineering", employment_type: "Full-time", role_level: "Mid-level", location: "Hybrid", status: "active", summary: "Build accessible, dependable interfaces for operational teams.", requirements: { essential_skills: ["React", "TypeScript", "Accessibility"] } },
  { id: "job-analyst", title: "People Operations Analyst", department: "People", employment_type: "Full-time", role_level: "Associate", location: "Remote", status: "draft", summary: "Turn hiring and people data into clear operational insight.", requirements: { essential_skills: ["Reporting", "Stakeholder communication"] } }
];

const candidateRows = [
  ["Avery Chen", "Senior Product Designer", 91, "shortlist", "Research-led workflow design", "Strong discovery practice and accessible design systems"],
  ["Jordan Patel", "Frontend Engineer", 87, "shortlist", "Accessible dashboard architecture", "Strong TypeScript and component ownership"],
  ["Morgan Rivera", "Senior Product Designer", 72, "review", "Enterprise design system", "Good system work; validate research depth"],
  ["Taylor Brooks", "Frontend Engineer", 68, "review", "React migration project", "Solid delivery; confirm testing strategy"],
  ["Samira Khan", "People Operations Analyst", 84, "shortlist", "Hiring funnel reporting", "Clear analysis and stakeholder communication"],
  ["Casey Morgan", "Senior Product Designer", 51, "reject", "Portfolio refresh", "Limited evidence of end-to-end ownership"],
  ["Riley Johnson", "Frontend Engineer", 48, "reject", "Personal web applications", "Limited production accessibility evidence"],
  ["Alex Lee", "People Operations Analyst", 63, "review", "Recruiting metrics dashboard", "Promising analysis; clarify data quality methods"]
] as const;

function createSeed(): DemoStore {
  const applicants: Applicant[] = candidateRows.map(([name, role, score, decision, project, summary], index) => {
    const job = seedJobs.find((item) => item.title === role)!;
    const id = `candidate-${index + 1}`;
    const email = `${name.toLowerCase().replace(" ", ".")}@example.test`;
    return {
      id, job_id: job.id, job_title: job.title, candidate_name: name, candidate_email: email, applied_role: role,
      processing_status: "completed", review_status: "pending", candidate_stage: "screening",
      system_outputs: { final_candidate_score: score, final_candidate_decision: decision, candidate_fit_summary: summary, top_strengths: [project, "Clear communication"], top_gaps: decision === "shortlist" ? ["Explore scope in interview"] : ["Validate depth of relevant experience"], best_project_relevance: project, interview_recommendation: decision === "shortlist" ? "yes" : "maybe" },
      selected_job_analysis: { job_id: job.id, job_title: job.title, status: "completed", final_score: score, decision, summary, matches_applied_role: true },
      job_analyses: [{ job_id: job.id, job_title: job.title, status: "completed", final_score: score, decision, summary, matches_applied_role: true }],
      final_evaluation: { summary, strengths: [project, "Clear communication"], gaps: ["Validate depth of relevant experience"], interview_recommendation: decision === "shortlist" ? "yes" : "maybe" },
      dimension_results: [
        { id: `${id}-skills`, dimension: "role_skills", score: Math.round(score / 10), confidence: 0.8, result_json: { reasoning: `Sample assessment based on ${project.toLowerCase()}.` } },
        { id: `${id}-ownership`, dimension: "project_ownership", score: Math.max(1, Math.round(score / 10) - 1), confidence: 0.7, result_json: { reasoning: "Sample evidence for recruiter review." } }
      ],
      resume: { extraction_status: "completed", extracted_text: `Portfolio demonstration profile for ${name}. ${project}. No real resume data is stored.` },
      profile: { profile_json: { name, role, highlighted_project: project, source: "Synthetic portfolio example" } },
      original_data: { name, email, role, source: "Synthetic portfolio example" }
    };
  });
  const rejected = applicants.filter((item) => item.system_outputs.final_candidate_decision === "reject");
  const emails: CandidateEmail[] = rejected.map((applicant, index) => ({
    id: `email-${index + 1}`, applicant_id: applicant.id, job_id: applicant.job_id!, run_id: `run-${index + 1}`, final_evaluation_id: `evaluation-${index + 1}`,
    to_email: applicant.candidate_email!, from_email: "hiring@example.test", candidate_name: applicant.candidate_name, job_title: applicant.job_title,
    subject: `Your application for ${applicant.job_title}`, body: `Hi ${applicant.candidate_name?.split(" ")[0]},\n\nThank you for your interest in the ${applicant.job_title} role. After review, we will not be moving forward at this time. We appreciate the time you invested in your application.\n\nBest,\nThe hiring team`,
    status: "draft", created_at: "2026-09-01T10:00:00Z", updated_at: "2026-09-01T10:00:00Z"
  }));
  return { jobs: seedJobs, applicants, emails, imports: [{ id: "import-sample", file_name: "sample_applicants.csv", row_count: applicants.length, status: "completed", job_title: "Multiple roles", job_id: seedJobs[0].id, applicant_count: applicants.length, counts: { completed: applicants.length, queued: 0, running: 0, failed: 0 }, created_at: "2026-09-01T09:00:00Z", applicant_ids: applicants.map((item) => item.id) }] };
}

function readStore(): DemoStore {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as DemoStore;
  } catch { /* Use clean synthetic data when storage is unavailable. */ }
  const store = createSeed();
  writeStore(store);
  return store;
}

function writeStore(store: DemoStore) {
  try { window.localStorage.setItem(KEY, JSON.stringify(store)); } catch { /* Demo remains usable for this interaction. */ }
}

function payload(init: RequestInit): Record<string, unknown> {
  if (typeof init.body !== "string") return {};
  try { return JSON.parse(init.body) as Record<string, unknown>; } catch { return {}; }
}

function csvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(cell); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell); if (row.some((item) => item.trim())) rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  row.push(cell); if (row.some((item) => item.trim())) rows.push(row);
  if (quoted) throw new Error("This CSV has an unclosed quoted field.");
  return rows;
}

function id() { return crypto.randomUUID(); }
function fail(message: string): never { throw new Error(message); }

export async function demoFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const store = readStore();
  const method = (init.method || "GET").toUpperCase();
  const url = new URL(path, "https://demo.local");
  const route = url.pathname;
  const data = payload(init);
  let result: unknown;

  if (route === "/jobs" && method === "GET") result = store.jobs;
  else if (route === "/jobs" && method === "POST") {
    const job = { ...data, id: id() } as JobProfile;
    store.jobs.unshift(job); result = job;
  } else if (route === "/jobs/draft-from-description" && method === "POST") {
    const description = String(data.description || "").trim();
    result = { title: description.split(/\r?\n/)[0].slice(0, 80), department: "", employment_type: "Full-time", role_level: "", location: "", summary: description.slice(0, 220), description, success_definition: "", responsibilities: "", practical_capabilities: "", essential_skills: [], desirable_skills: [], tools_platforms: [], preferred_domains: [], preferred_projects: [], preferred_ownership_level: "", expected_experience_depth: "", education_preferences: "", communication_expectations: "" };
  } else if (route.startsWith("/jobs/") && method === "PUT") {
    const job = store.jobs.find((item) => item.id === route.split("/")[2]) ?? fail("Job profile not found.");
    Object.assign(job, data); result = job;
  } else if (route.startsWith("/jobs/") && method === "DELETE") {
    store.jobs = store.jobs.filter((item) => item.id !== route.split("/")[2]); result = { deleted: true };
  } else if (route === "/applicants" && method === "GET") result = store.applicants;
  else if (route === "/applicants/reprocess" && method === "POST") {
    const ids = data.applicant_ids as string[] || [];
    store.applicants.filter((item) => ids.includes(item.id)).forEach((item) => { item.processing_status = "queued"; });
    result = { queued: ids.length };
  } else if (route === "/applicants/analyze-for-job" && method === "POST") {
    const job = store.jobs.find((item) => item.id === data.job_id) ?? fail("Job profile not found.");
    const importItem = store.imports.find((item) => item.id === data.import_id);
    const ids = (data.applicant_ids as string[] | undefined) ?? importItem?.applicant_ids ?? [];
    const matches = store.applicants.filter((item) => ids.includes(item.id));
    matches.forEach((item) => {
      const analysis = { job_id: job.id, job_title: job.title, status: "queued", final_score: null, decision: null, summary: "Demo analysis queued. No AI processing runs in portfolio mode.", matches_applied_role: item.applied_role === job.title };
      item.job_analyses = [...(item.job_analyses || []).filter((existing) => existing.job_id !== job.id), analysis];
      item.selected_job_analysis = analysis;
      item.processing_status = "queued";
    });
    result = { queued: matches.length, skipped: [] };
  } else if (route === "/applicants/delete" && method === "POST") {
    const ids = data.applicant_ids as string[] || [];
    store.applicants = store.applicants.filter((item) => !ids.includes(item.id));
    store.emails = store.emails.filter((item) => !ids.includes(item.applicant_id)); result = { deleted: ids.length };
  } else if (/^\/applicants\/[^/]+\/reprocess$/.test(route) && method === "POST") {
    const applicant = store.applicants.find((item) => item.id === route.split("/")[2]) ?? fail("Applicant not found.");
    applicant.processing_status = "queued"; result = { queued: true };
  } else if (/^\/applicants\/[^/]+$/.test(route) && method === "GET") {
    const applicant = store.applicants.find((item) => item.id === route.split("/")[2]) ?? fail("Applicant not found.");
    const selected = url.searchParams.get("job_id");
    result = selected ? { ...applicant, selected_job_analysis: applicant.job_analyses?.find((item) => item.job_id === selected) } : applicant;
  } else if (/^\/applicants\/[^/]+$/.test(route) && method === "DELETE") {
    const target = route.split("/")[2]; store.applicants = store.applicants.filter((item) => item.id !== target);
    store.emails = store.emails.filter((item) => item.applicant_id !== target); result = { deleted: true };
  } else if (route === "/candidate-emails" && method === "GET") {
    result = store.emails.filter((item) => !url.searchParams.get("applicant_id") || item.applicant_id === url.searchParams.get("applicant_id"));
  } else if (route === "/candidate-emails/draft-rejections" && method === "POST") {
    const ids = data.applicant_ids as string[] || [];
    const drafted: CandidateEmail[] = [], skipped: Array<{ reason: string }> = [];
    ids.forEach((candidateId) => {
      const applicant = store.applicants.find((item) => item.id === candidateId);
      if (!applicant || applicant.system_outputs.final_candidate_decision !== "reject" || applicant.job_id !== data.job_id) { skipped.push({ reason: "Only rejected applicants for the selected role can have a draft." }); return; }
      store.emails = store.emails.filter((item) => !(item.applicant_id === applicant.id && item.job_id === data.job_id && item.status === "draft"));
      const email: CandidateEmail = { id: id(), applicant_id: applicant.id, job_id: applicant.job_id!, run_id: id(), final_evaluation_id: id(), to_email: applicant.candidate_email!, from_email: "hiring@example.test", candidate_name: applicant.candidate_name, job_title: applicant.job_title, subject: `Your application for ${applicant.job_title}`, body: `Hi ${applicant.candidate_name?.split(" ")[0]},\n\nThank you for applying. After review, we will not be moving forward at this time.\n\nBest,\nThe hiring team`, status: "draft", created_at: new Date().toISOString() };
      store.emails.unshift(email); drafted.push(email);
    });
    result = { drafted, skipped };
  } else if (route === "/candidate-emails/send-bulk" && method === "POST") {
    const ids = data.email_ids as string[] || [];
    const sent = store.emails.filter((item) => ids.includes(item.id) && item.status === "draft");
    sent.forEach((item) => { item.status = "sent"; item.sent_at = new Date().toISOString(); }); result = { sent, failed: [] };
  } else if (/^\/candidate-emails\/[^/]+$/.test(route) && method === "PATCH") {
    const email = store.emails.find((item) => item.id === route.split("/")[2]) ?? fail("Email draft not found.");
    if (email.status !== "draft") fail("Only drafts can be edited.");
    Object.assign(email, data, { updated_at: new Date().toISOString() }); result = email;
  } else if (/^\/candidate-emails\/[^/]+\/send$/.test(route) && method === "POST") {
    const email = store.emails.find((item) => item.id === route.split("/")[2]) ?? fail("Email draft not found.");
    if (email.status !== "draft") fail("Only drafts can be sent.");
    email.status = "sent"; email.sent_at = new Date().toISOString(); result = email;
  } else if (route === "/imports" && method === "GET") result = store.imports;
  else if (route === "/imports" && method === "POST") {
    const form = init.body as FormData;
    const file = form.get("file");
    const job = store.jobs.find((item) => item.id === form.get("job_id")) ?? fail("Choose a job profile first.");
    if (!(file instanceof File)) fail("Choose a CSV file first.");
    if (file.size > 1024 * 1024) fail("The demo accepts CSV files up to 1 MB.");
    const rows = csvRows(await file.text());
    if (rows.length < 2) fail("The CSV needs a header and at least one applicant row.");
    if (rows.length > 51) fail("The demo accepts up to 50 applicant rows.");
    const headers = rows[0].map((item) => item.trim().toLowerCase());
    const nameIndex = headers.findIndex((item) => ["name", "candidate_name", "full_name"].includes(item));
    const emailIndex = headers.findIndex((item) => ["email", "candidate_email", "email_address"].includes(item));
    if (nameIndex < 0) fail("Add a name or candidate_name column to the CSV.");
    const importId = id();
    const imported = rows.slice(1).map((row) => {
      const applicantId = id(); const name = row[nameIndex]?.trim() || "Unnamed candidate";
      return { id: applicantId, job_id: job.id, job_title: job.title, candidate_name: name, candidate_email: emailIndex >= 0 ? row[emailIndex]?.trim() : "", applied_role: job.title, processing_status: "queued", system_outputs: {}, original_data: Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])) } as Applicant;
    });
    store.applicants.unshift(...imported);
    store.imports.unshift({ id: importId, file_name: file.name, row_count: imported.length, status: "imported", job_title: job.title, job_id: job.id, applicant_count: imported.length, counts: { queued: imported.length, completed: 0, running: 0, failed: 0 }, created_at: new Date().toISOString(), applicant_ids: imported.map((item) => item.id) });
    result = { id: importId, row_count: imported.length, queued_applicant_ids: imported.map((item) => item.id) };
  } else if (/^\/imports\/[^/]+\/progress$/.test(route) && method === "GET") {
    const item = store.imports.find((entry) => entry.id === route.split("/")[2]) ?? fail("Import batch not found.");
    const applicants = store.applicants.filter((applicant) => item.applicant_ids.includes(applicant.id));
    const counts = { queued: 0, running: 0, completed: 0, failed: 0, missing_resume: 0 };
    applicants.forEach((applicant) => { if (applicant.processing_status in counts) counts[applicant.processing_status as keyof typeof counts] += 1; });
    const done = counts.completed + counts.failed + counts.missing_resume;
    result = { status: item.status, job_title: item.job_title, total: applicants.length, done, percent: applicants.length ? Math.round(done / applicants.length * 100) : 0, counts, applicants: applicants.map((applicant) => ({ id: applicant.id, candidate_name: applicant.candidate_name, processing_status: applicant.processing_status, decision: applicant.system_outputs.final_candidate_decision, score: applicant.system_outputs.final_candidate_score })) };
  } else if (/^\/imports\/[^/]+\/(pause|resume)$/.test(route) && method === "POST") {
    const item = store.imports.find((entry) => entry.id === route.split("/")[2]) ?? fail("Import batch not found.");
    item.status = route.endsWith("pause") ? "paused" : "imported"; result = item;
  } else if (/^\/imports\/[^/]+$/.test(route) && method === "DELETE") {
    const item = store.imports.find((entry) => entry.id === route.split("/")[2]) ?? fail("Import batch not found.");
    store.imports = store.imports.filter((entry) => entry.id !== item.id);
    store.applicants = store.applicants.filter((entry) => !item.applicant_ids.includes(entry.id));
    store.emails = store.emails.filter((entry) => !item.applicant_ids.includes(entry.applicant_id)); result = { deleted: true };
  } else fail(`Demo action not available: ${method} ${route}`);

  if (method !== "GET") writeStore(store);
  return structuredClone(result) as T;
}

export function resetDemo() { window.localStorage.removeItem(KEY); }

export function demoCsv(jobId: string, decision?: string) {
  const rows = readStore().applicants.filter((item) => item.job_id === jobId && (!decision || item.system_outputs.final_candidate_decision === decision));
  const columns = ["candidate_name", "candidate_email", "applied_role", "processing_status", "final_candidate_score", "final_candidate_decision"];
  const escape = (value: unknown) => {
    let text = String(value ?? "");
    if (/^[\s]*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replaceAll('"', '""')}"`;
  };
  return [columns.join(","), ...rows.map((item) => [item.candidate_name, item.candidate_email, item.applied_role, item.processing_status, item.system_outputs.final_candidate_score, item.system_outputs.final_candidate_decision].map(escape).join(","))].join("\r\n");
}
