"use client";

import { useEffect, useState } from "react";
import { FileDown } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { apiFetch, DEMO_MODE, exportUrl, getToken } from "@/lib/api";
import { demoCsv } from "@/lib/demo";
import type { JobProfile } from "@/types/domain";

export default function ExportsPage() {
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [jobId, setJobId] = useState("");
  const [decision, setDecision] = useState("");
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    apiFetch<JobProfile[]>("/jobs").then((data) => {
      setJobs(data);
      setJobId(data[0]?.id ?? "");
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "Job profiles could not be loaded."));
  }, []);

  async function download() {
    if (!jobId) return;
    setError("");
    setDownloading(true);
    try {
      let blob: Blob;
      if (DEMO_MODE) {
        blob = new Blob([demoCsv(jobId, decision || undefined)], { type: "text/csv;charset=utf-8" });
      } else {
        const response = await fetch(exportUrl(jobId, decision || undefined), {
          headers: { Authorization: `Bearer ${getToken()}` }
        });
        if (!response.ok) throw new Error("Export could not be downloaded. Please try again.");
        blob = await response.blob();
      }
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${decision || "all"}-enriched-applicants.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Export could not be downloaded.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Recruiter-ready output"
        title="Exports"
        description="Download clean enriched CSV files with only the operational AI columns added."
      />
      <Card className="max-w-4xl">
        {error && <p role="alert" className="mb-5 rounded-md border border-[#e8b9b4] bg-[#fff3f1] p-3 text-sm text-[#8e3932]">{error}</p>}
        <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#e9f3f6] text-moss">
            <FileDown size={20} />
          </div>
          <div>
            <h2 className="font-black">Choose export</h2>
            <p className="text-sm text-[#5f6f6b]">Export all applicants or only one decision group.</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">
            Job
            <select className="focus-ring mt-1 min-h-10 w-full rounded-md border border-line bg-white px-3" value={jobId} onChange={(event) => setJobId(event.target.value)}>
              {jobs.map((job) => <option key={job.id} value={job.id}>{job.title}</option>)}
            </select>
          </label>
          <label className="text-sm font-medium">
            Export type
            <select className="focus-ring mt-1 min-h-10 w-full rounded-md border border-line bg-white px-3" value={decision} onChange={(event) => setDecision(event.target.value)}>
              <option value="">Full enriched CSV</option>
              <option value="shortlist">Shortlist only</option>
              <option value="review">Review only</option>
              <option value="reject">Rejected only</option>
            </select>
          </label>
        </div>
        <Button className="mt-5" onClick={download} disabled={!jobId || downloading} aria-busy={downloading}>{downloading ? "Preparing export…" : "Download CSV"}</Button>
        {!jobs.length && !error && <p className="mt-3 text-sm text-[var(--muted)]">Create a job profile before exporting applicant data.</p>}
        <p className="mt-4 text-sm leading-6 text-[#5f6f6b]">{DEMO_MODE ? "This CSV contains synthetic demo candidates and their sample decisions." : "The export preserves original applicant columns and adds only the ten recruiter-facing AI output fields."}</p>
      </Card>
    </div>
  );
}
