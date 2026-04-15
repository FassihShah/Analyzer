"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Applicant, CandidateEmail, JobProfile } from "@/types/domain";

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[440px] overflow-auto rounded-lg border border-line bg-paper p-4 text-xs leading-5">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [emails, setEmails] = useState<CandidateEmail[]>([]);
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [jobId, setJobId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    apiFetch<Applicant>(`/applicants/${params.id}`).then(setApplicant);
  }

  function loadEmails() {
    apiFetch<CandidateEmail[]>(`/candidate-emails?applicant_id=${params.id}`).then(setEmails).catch(() => setEmails([]));
  }

  useEffect(load, [params.id]);
  useEffect(loadEmails, [params.id]);

  useEffect(() => {
    apiFetch<JobProfile[]>("/jobs").then((data) => {
      setJobs(data);
      setJobId(data[0]?.id ?? "");
    }).catch(() => setJobs([]));
  }, []);

  async function reprocess() {
    setError("");
    setMessage("");
    try {
      await apiFetch(`/applicants/${params.id}/reprocess`, { method: "POST" });
      setMessage("Applicant queued for re-analysis.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue applicant.");
    }
  }

  async function analyzeForJob() {
    if (!jobId) return;
    setError("");
    setMessage("");
    try {
      await apiFetch("/applicants/analyze-for-job", { method: "POST", body: JSON.stringify({ applicant_ids: [params.id], job_id: jobId, force: true }) });
      setMessage("Applicant queued for the selected job.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue applicant for this job.");
    }
  }

  async function draftRejectionEmail() {
    if (!jobId) return;
    setError("");
    setMessage("");
    try {
      const result = await apiFetch<{ drafted: Array<{ id: string }>; skipped: Array<{ reason: string }> }>("/candidate-emails/draft-rejections", {
        method: "POST",
        body: JSON.stringify({ applicant_ids: [params.id], job_id: jobId, overwrite_existing_drafts: true })
      });
      if (result.drafted.length) {
        setMessage("Rejection email draft ready in Emails.");
      } else {
        setError(result.skipped[0]?.reason ?? "This candidate is not eligible for a rejection email draft.");
      }
      load();
      loadEmails();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not draft rejection email.");
    }
  }

  if (!applicant) return <p>Loading candidate...</p>;
  const output = applicant.system_outputs || {};
  const final = applicant.final_evaluation || {};

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Candidate detail"
        title={applicant.candidate_name ?? "Unnamed candidate"}
        description={`${applicant.candidate_email ?? "No email"} | ${applicant.applied_role ?? "No role"}`}
        action={<Button onClick={reprocess}>Re-run analysis</Button>}
      />
      {(error || message) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-[#efc6bd] bg-[#fff1ee] text-[#8a352b]" : "border-[#c8dfd4] bg-[#edf8f2] text-[#245b45]"}`}>
          {error || message}
        </div>
      )}
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-black">Job analyses</h2>
            <p className="mt-1 text-sm text-[#5f6f6b]">Review this candidate across job titles or queue another job analysis.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="focus-ring min-h-10 rounded-md border border-line bg-white px-3 text-sm" value={jobId} onChange={(event) => setJobId(event.target.value)}>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
            <Button onClick={analyzeForJob} disabled={!jobId}>Analyze for job</Button>
            <Button className="bg-[#4d5752]" onClick={draftRejectionEmail} disabled={!jobId}>Draft rejection email</Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs font-bold uppercase tracking-normal text-[#5f6f6b]">
              <tr>
                <th className="py-2 pr-4">Job</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Decision</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Summary</th>
              </tr>
            </thead>
            <tbody>
              {(applicant.job_analyses || []).map((analysis) => (
                <tr className="border-b border-line align-top" key={analysis.run_id ?? analysis.job_id}>
                  <td className="py-3 pr-4 font-semibold">{analysis.job_title}</td>
                  <td className="py-3 pr-4 font-bold">{analysis.final_score ?? "-"}</td>
                  <td className="py-3 pr-4"><StatusBadge value={analysis.decision ?? undefined} /></td>
                  <td className="py-3 pr-4"><StatusBadge value={analysis.status} /></td>
                  <td className="py-3 pr-4 text-[#4f5f5b]">{analysis.summary || analysis.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-lg font-black">Rejection email history</h2>
            <p className="mt-1 text-sm text-[#5f6f6b]">Track every drafted, sent, or failed rejection email for this applicant by role.</p>
          </div>
          <Button className="bg-[#4d5752]" onClick={loadEmails}>Refresh emails</Button>
        </div>
        <div className="mt-4 space-y-4">
          {emails.map((email) => (
            <div className="rounded-lg border border-line bg-paper/80 p-4" key={email.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black">{email.job_title || "Unknown role"}</p>
                    <StatusBadge value={email.status} />
                  </div>
                  <p className="mt-1 text-sm text-[#5f6f6b]">To: {email.to_email} | Sent: {formatDateTime(email.sent_at)}</p>
                  {email.failure_reason && <p className="mt-2 rounded-md border border-[#f1b2a4] bg-[#fff0ed] px-3 py-2 text-sm text-[#9c3726]">{email.failure_reason}</p>}
                </div>
                <p className="text-xs font-bold uppercase tracking-normal text-[#5f6f6b]">Updated {formatDateTime(email.updated_at)}</p>
              </div>
              <div className="mt-4 rounded-lg border border-line bg-white p-4">
                <p className="text-sm font-black">{email.subject}</p>
                <pre className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#33403d]">{email.body}</pre>
              </div>
            </div>
          ))}
          {!emails.length && <p className="rounded-lg border border-dashed border-line bg-paper/70 p-4 text-sm text-[#5f6f6b]">No rejection email has been drafted or sent for this applicant yet.</p>}
        </div>
      </Card>
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="min-h-28"><p className="text-sm font-semibold text-[#5f6f6b]">Final score</p><p className="mt-3 text-3xl font-black">{output.final_candidate_score ?? "-"}</p></Card>
        <Card className="min-h-28"><p className="text-sm font-semibold text-[#5f6f6b]">Decision</p><div className="mt-4"><StatusBadge value={output.final_candidate_decision} /></div></Card>
        <Card className="min-h-28"><p className="text-sm font-semibold text-[#5f6f6b]">Analysis</p><div className="mt-4"><StatusBadge value={applicant.processing_status} /></div></Card>
        <Card className="min-h-28"><p className="text-sm font-semibold text-[#5f6f6b]">Interview</p><p className="mt-3 text-xl font-black capitalize">{output.interview_recommendation ?? "maybe"}</p></Card>
      </section>
      <Card>
        <h2 className="text-lg font-black">Decision rationale</h2>
        <p className="mt-3 text-sm leading-6">{output.candidate_fit_summary ?? final.summary ?? "No synthesis yet."}</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-semibold">Top strengths</h3>
            <p className="mt-2 text-sm">{Array.isArray(output.top_strengths) ? output.top_strengths.join("; ") : output.top_strengths}</p>
          </div>
          <div>
            <h3 className="font-semibold">Top gaps</h3>
            <p className="mt-2 text-sm">{Array.isArray(output.top_gaps) ? output.top_gaps.join("; ") : output.top_gaps}</p>
          </div>
        </div>
      </Card>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-black">Dimension-wise evaluations</h2>
          <div className="mt-4 space-y-3">
            {(applicant.dimension_results || []).map((result) => (
              <div className="rounded-lg border border-line p-4 transition hover:border-moss" key={String(result.id)}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold capitalize">{String(result.dimension).replaceAll("_", " ")}</p>
                  <p className="rounded-md bg-paper px-2 py-1 text-xs font-semibold">{String(result.score ?? "-")} / 10 | confidence {String(result.confidence ?? "-")}</p>
                </div>
                <p className="mt-2 text-sm text-[#4f5f5b]">{result.result_json?.reasoning}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-black">Resume parsing</h2>
          <p className="mt-2 text-sm">Status: {String(applicant.resume?.extraction_status ?? "unknown")}</p>
          <pre className="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-paper p-4 text-xs">{String(applicant.resume?.extracted_text ?? "No extracted text stored yet.").slice(0, 6000)}</pre>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-black">Structured candidate profile</h2>
          <div className="mt-4"><JsonPanel value={applicant.profile?.profile_json} /></div>
        </Card>
        <Card>
          <h2 className="text-lg font-black">Original applicant data</h2>
          <div className="mt-4"><JsonPanel value={applicant.original_data} /></div>
        </Card>
      </section>
    </div>
  );
}
