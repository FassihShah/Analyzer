"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import type { Applicant, JobProfile } from "@/types/domain";

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [jobId, setJobId] = useState("");
  const [analysisJobId, setAnalysisJobId] = useState("");
  const [decision, setDecision] = useState("");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function load() {
    apiFetch<Applicant[]>("/applicants")
      .then(setApplicants)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load applicants."));
  }

  useEffect(load, []);

  useEffect(() => {
    apiFetch<JobProfile[]>("/jobs").then((data) => {
      setJobs(data);
      setAnalysisJobId(data[0]?.id ?? "");
    }).catch(() => setJobs([]));
  }, []);

  const filtered = useMemo(() => {
    return applicants.filter((applicant) => {
      const output = applicant.system_outputs || {};
      const analysis = applicant.selected_job_analysis;
      const matchesJob = !jobId || applicant.job_id === jobId || applicant.job_analyses?.some((item) => item.job_id === jobId);
      const matchesDecision = !decision || analysis?.decision === decision || output.final_candidate_decision === decision;
      const matchesStatus = !status || applicant.processing_status === status;
      const haystack = `${applicant.candidate_name} ${applicant.candidate_email} ${output.top_strengths}`.toLowerCase();
      return matchesJob && matchesDecision && matchesStatus && haystack.includes(query.toLowerCase());
    });
  }, [applicants, decision, jobId, query, status]);

  const filteredIds = useMemo(() => filtered.map((applicant) => applicant.id), [filtered]);
  const selectedVisibleCount = useMemo(() => filteredIds.filter((id) => selectedIds.includes(id)).length, [filteredIds, selectedIds]);
  const filteredStatusCounts = useMemo(() => {
    return filtered.reduce<Record<string, number>>((counts, applicant) => {
      counts[applicant.processing_status] = (counts[applicant.processing_status] ?? 0) + 1;
      return counts;
    }, {});
  }, [filtered]);

  async function reprocess(id: string) {
    setError("");
    setMessage("");
    try {
      await apiFetch(`/applicants/${id}/reprocess`, { method: "POST" });
      setMessage("Applicant queued for re-analysis.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue applicant.");
    }
  }

  async function reprocessSelected() {
    if (!selectedIds.length) return;
    setError("");
    setMessage("");
    try {
      await apiFetch("/applicants/reprocess", { method: "POST", body: JSON.stringify({ applicant_ids: selectedIds }) });
      setMessage(`${selectedIds.length} applicants queued for re-analysis.`);
      setSelectedIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue selected applicants.");
    }
  }

  async function analyzeSelectedForJob() {
    if (!selectedIds.length || !analysisJobId) return;
    setError("");
    setMessage("");
    try {
      await apiFetch("/applicants/analyze-for-job", { method: "POST", body: JSON.stringify({ applicant_ids: selectedIds, job_id: analysisJobId, force: true }) });
      setMessage(`${selectedIds.length} applicants queued for the selected job.`);
      setSelectedIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not queue selected applicants for this job.");
    }
  }

  async function deleteApplicant(applicant: Applicant) {
    const name = applicant.candidate_name || "this applicant";
    const ok = window.confirm(`Delete ${name} and all related analysis data?`);
    if (!ok) return;
    setError("");
    setMessage("");
    try {
      await apiFetch(`/applicants/${applicant.id}`, { method: "DELETE" });
      setMessage(`${name} deleted.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete applicant.");
    }
  }

  async function deleteSelected() {
    if (!selectedIds.length) return;
    const ok = window.confirm(`Delete ${selectedIds.length} selected applicants and all related analysis data?`);
    if (!ok) return;
    setError("");
    setMessage("");
    try {
      await apiFetch("/applicants/delete", { method: "POST", body: JSON.stringify({ applicant_ids: selectedIds }) });
      setMessage(`${selectedIds.length} applicants deleted.`);
      setSelectedIds([]);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete selected applicants.");
    }
  }

  function toggleSelected(id: string) {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function toggleAllFiltered() {
    setSelectedIds((current) => {
      const allVisibleSelected = filteredIds.length > 0 && filteredIds.every((id) => current.includes(id));
      if (allVisibleSelected) return current.filter((id) => !filteredIds.includes(id));
      return Array.from(new Set([...current, ...filteredIds]));
    });
  }

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Ranked candidate review"
        title="Applicants"
        description="Filter candidates, inspect decisions, and queue reprocessing when a resume or job profile changes."
      />
      {(error || message) && (
        <div className={`rounded-lg border px-4 py-3 text-sm ${error ? "border-[#efc6bd] bg-[#fff1ee] text-[#8a352b]" : "border-[#c8dfd4] bg-[#edf8f2] text-[#245b45]"}`}>
          {error || message}
        </div>
      )}
      <Card className="overflow-hidden p-0">
        <div className="grid gap-5 border-b border-line bg-paper/70 p-5 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-normal text-[#65706a]">Filtered applicants</p>
            <p className="mt-1 text-2xl font-bold text-moss">{filtered.length}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-normal text-[#65706a]">Selected</p>
            <p className="mt-1 text-2xl font-bold text-moss">{selectedVisibleCount}<span className="text-sm font-medium text-[#65706a]"> / {selectedIds.length} total</span></p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-normal text-[#65706a]">Completed</p>
            <p className="mt-1 text-2xl font-bold text-moss">{filteredStatusCounts.completed ?? 0}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-normal text-[#65706a]">Failed / missing</p>
            <p className="mt-1 text-2xl font-bold text-coral">{(filteredStatusCounts.failed ?? 0) + (filteredStatusCounts.missing_resume ?? 0)}</p>
          </div>
        </div>
        <div className="grid gap-3 border-b border-line p-5 xl:grid-cols-[1fr_180px_180px_180px_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8c958f]" size={18} />
            <Input className="pl-10" placeholder="Filter by name, email, skill, or strength" value={query} onChange={(event) => setQuery(event.target.value)} />
          </div>
          <select className="focus-ring min-h-10 rounded-md border border-line bg-white px-3 text-sm" value={decision} onChange={(event) => setDecision(event.target.value)}>
            <option value="">All decisions</option>
            <option value="shortlist">Shortlist</option>
            <option value="review">Review</option>
            <option value="reject">Reject</option>
          </select>
          <select className="focus-ring min-h-10 rounded-md border border-line bg-white px-3 text-sm" value={jobId} onChange={(event) => setJobId(event.target.value)}>
            <option value="">All job analyses</option>
            {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
          </select>
          <select className="focus-ring min-h-10 rounded-md border border-line bg-white px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="">All statuses</option>
            <option value="queued">Queued</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="missing_resume">Missing resume</option>
          </select>
          <div className="flex gap-2">
            <Button className="min-h-10 bg-[#4d5752] px-3" onClick={reprocessSelected} disabled={!selectedIds.length}>Re-run ({selectedIds.length})</Button>
            <Button className="min-h-10 bg-coral px-3 hover:bg-[#a84436]" onClick={deleteSelected} disabled={!selectedIds.length}>Delete ({selectedIds.length})</Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-b border-line bg-paper/40 p-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[#65706a]">
            {selectedVisibleCount} selected in current filter, {selectedIds.length} selected overall.
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <select className="focus-ring min-h-10 rounded-md border border-line bg-white px-3 text-sm" value={analysisJobId} onChange={(event) => setAnalysisJobId(event.target.value)}>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
            <Button className="min-h-10 bg-[#4d5752] px-3" onClick={analyzeSelectedForJob} disabled={!selectedIds.length || !analysisJobId}>Analyze selected ({selectedIds.length}) for job</Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left text-sm">
            <thead className="bg-paper">
              <tr className="border-b border-line text-xs uppercase tracking-normal text-[#65706a]">
                <th className="px-5 py-3">
                  <input type="checkbox" checked={filteredIds.length > 0 && filteredIds.every((id) => selectedIds.includes(id))} onChange={toggleAllFiltered} />
                </th>
                <th className="px-4 py-3">Candidate</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Decision</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Best project</th>
                <th className="px-4 py-3">Top strengths</th>
                <th className="px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((applicant) => {
                const output = applicant.system_outputs || {};
                const analysis = applicant.selected_job_analysis;
                return (
                  <tr className="border-b border-line align-top transition hover:bg-paper/80" key={applicant.id}>
                    <td className="px-5 py-4">
                      <input type="checkbox" checked={selectedIds.includes(applicant.id)} onChange={() => toggleSelected(applicant.id)} />
                    </td>
                    <td className="px-4 py-4">
                      <Link className="font-semibold text-moss" href={`/applicants/${applicant.id}`}>{applicant.candidate_name ?? "Unnamed"}</Link>
                      <p className="mt-1 text-xs text-[#65706a]">{applicant.candidate_email}</p>
                    </td>
                    <td className="px-4 py-4">{applicant.applied_role}</td>
                    <td className="px-4 py-4">
                      <p className="font-bold">{analysis?.final_score ?? output.final_candidate_score ?? "-"}</p>
                      <p className="mt-1 text-xs text-[#65706a]">{analysis?.job_title ?? applicant.job_title}</p>
                    </td>
                    <td className="px-4 py-4"><StatusBadge value={analysis?.decision ?? output.final_candidate_decision} /></td>
                    <td className="px-4 py-4"><StatusBadge value={applicant.processing_status} /></td>
                    <td className="max-w-56 px-4 py-4 text-[#4d5752]">{output.best_project_relevance ?? "-"}</td>
                    <td className="max-w-72 px-4 py-4 text-[#4d5752]">{Array.isArray(output.top_strengths) ? output.top_strengths.join("; ") : output.top_strengths}</td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <Button className="min-h-8 px-3 py-1 text-xs" onClick={() => reprocess(applicant.id)}>Re-run</Button>
                        <button className="focus-ring rounded-lg border border-line p-2 text-coral hover:bg-[#fff1ee]" onClick={() => deleteApplicant(applicant)} title="Delete applicant">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
