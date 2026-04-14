"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Applicant, JobProfile } from "@/types/domain";

function JsonPanel({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[440px] overflow-auto rounded-lg border border-line bg-paper p-4 text-xs leading-5">
      {JSON.stringify(value ?? {}, null, 2)}
    </pre>
  );
}

export default function CandidateDetailPage() {
  const params = useParams<{ id: string }>();
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [jobId, setJobId] = useState("");

  function load() {
    apiFetch<Applicant>(`/applicants/${params.id}`).then(setApplicant);
  }

  useEffect(load, [params.id]);

  useEffect(() => {
    apiFetch<JobProfile[]>("/jobs").then((data) => {
      setJobs(data);
      setJobId(data[0]?.id ?? "");
    }).catch(() => setJobs([]));
  }, []);

  async function reprocess() {
    await apiFetch(`/applicants/${params.id}/reprocess`, { method: "POST" });
    load();
  }

  async function analyzeForJob() {
    if (!jobId) return;
    await apiFetch("/applicants/analyze-for-job", { method: "POST", body: JSON.stringify({ applicant_ids: [params.id], job_id: jobId, force: true }) });
    load();
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
      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-bold">Job analyses</h2>
            <p className="mt-1 text-sm text-[#65706a]">Review this candidate across job titles or queue another job analysis.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className="focus-ring min-h-10 rounded-md border border-line bg-white px-3 text-sm" value={jobId} onChange={(event) => setJobId(event.target.value)}>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
            <Button onClick={analyzeForJob} disabled={!jobId}>Analyze for job</Button>
          </div>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-normal text-[#65706a]">
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
                  <td className="py-3 pr-4 text-[#4d5752]">{analysis.summary || analysis.reason || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="min-h-28"><p className="text-sm text-[#65706a]">Final score</p><p className="mt-3 text-3xl font-bold">{output.final_candidate_score ?? "-"}</p></Card>
        <Card className="min-h-28"><p className="text-sm text-[#65706a]">Decision</p><div className="mt-4"><StatusBadge value={output.final_candidate_decision} /></div></Card>
        <Card className="min-h-28"><p className="text-sm text-[#65706a]">Analysis</p><div className="mt-4"><StatusBadge value={applicant.processing_status} /></div></Card>
        <Card className="min-h-28"><p className="text-sm text-[#65706a]">Interview</p><p className="mt-3 text-xl font-bold capitalize">{output.interview_recommendation ?? "maybe"}</p></Card>
      </section>
      <Card>
        <h2 className="text-lg font-bold">Decision rationale</h2>
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
          <h2 className="text-lg font-bold">Dimension-wise evaluations</h2>
          <div className="mt-4 space-y-3">
            {(applicant.dimension_results || []).map((result) => (
              <div className="rounded-lg border border-line p-4 transition hover:border-moss" key={String(result.id)}>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold capitalize">{String(result.dimension).replaceAll("_", " ")}</p>
                  <p className="rounded-md bg-paper px-2 py-1 text-xs font-semibold">{String(result.score ?? "-")} / 10 | confidence {String(result.confidence ?? "-")}</p>
                </div>
                <p className="mt-2 text-sm text-[#4d5752]">{result.result_json?.reasoning}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Resume parsing</h2>
          <p className="mt-2 text-sm">Status: {String(applicant.resume?.extraction_status ?? "unknown")}</p>
          <pre className="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-paper p-4 text-xs">{String(applicant.resume?.extracted_text ?? "No extracted text stored yet.").slice(0, 6000)}</pre>
        </Card>
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">Structured candidate profile</h2>
          <div className="mt-4"><JsonPanel value={applicant.profile?.profile_json} /></div>
        </Card>
        <Card>
          <h2 className="text-lg font-bold">Original applicant data</h2>
          <div className="mt-4"><JsonPanel value={applicant.original_data} /></div>
        </Card>
      </section>
    </div>
  );
}
