import assert from "node:assert/strict";

const memory = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => memory.set(key, value),
    removeItem: (key) => memory.delete(key)
  }
};

const { demoFetch, demoCsv, resetDemo } = await import("../lib/demo.ts");

const jobs = await demoFetch("/jobs");
const applicants = await demoFetch("/applicants");
const emails = await demoFetch("/candidate-emails");
assert.equal(jobs.length, 3);
assert.equal(applicants.length, 8);
assert.equal(emails.length, 2);
assert.match(demoCsv("job-product"), /Avery Chen/);

const created = await demoFetch("/jobs", { method: "POST", body: JSON.stringify({ title: "QA Engineer", status: "active" }) });
await demoFetch(`/jobs/${created.id}`, { method: "PUT", body: JSON.stringify({ title: "Senior QA Engineer" }) });
assert.equal((await demoFetch("/jobs")).find((job) => job.id === created.id).title, "Senior QA Engineer");
await demoFetch(`/jobs/${created.id}`, { method: "DELETE" });
assert.equal((await demoFetch("/jobs")).length, 3);

const draft = await demoFetch("/jobs/draft-from-description", { method: "POST", body: JSON.stringify({ description: "Research Engineer\nBuild evaluation tools." }) });
assert.equal(draft.title, "Research Engineer");

const rejected = applicants.find((item) => item.system_outputs.final_candidate_decision === "reject");
const drafted = await demoFetch("/candidate-emails/draft-rejections", { method: "POST", body: JSON.stringify({ applicant_ids: [rejected.id], job_id: rejected.job_id }) });
assert.equal(drafted.drafted.length, 1);
await demoFetch(`/candidate-emails/${drafted.drafted[0].id}`, { method: "PATCH", body: JSON.stringify({ subject: "Updated subject" }) });
const sent = await demoFetch(`/candidate-emails/${drafted.drafted[0].id}/send`, { method: "POST" });
assert.equal(sent.status, "sent");
assert.equal((await demoFetch(`/candidate-emails?applicant_id=${rejected.id}`)).length >= 1, true);

const form = new FormData();
form.set("job_id", "job-product");
form.set("file", new File(["name,email\nDemo Person,demo@example.test\n"], "demo.csv", { type: "text/csv" }));
const imported = await demoFetch("/imports", { method: "POST", body: form });
assert.equal(imported.row_count, 1);
const progress = await demoFetch(`/imports/${imported.id}/progress`);
assert.equal(progress.counts.queued, 1);
await demoFetch(`/imports/${imported.id}/pause`, { method: "POST" });
assert.equal((await demoFetch(`/imports/${imported.id}/progress`)).status, "paused");
await demoFetch(`/imports/${imported.id}`, { method: "DELETE" });
assert.equal((await demoFetch("/applicants")).length, 8);

await demoFetch("/applicants/analyze-for-job", { method: "POST", body: JSON.stringify({ applicant_ids: [applicants[0].id], job_id: "job-product" }) });
assert.equal((await demoFetch(`/applicants/${applicants[0].id}`)).processing_status, "queued");
resetDemo();
assert.equal((await demoFetch("/applicants")).length, 8);

console.log("Demo flows passed: seed, jobs, draft, email, CSV import, progress, analysis, reset.");
