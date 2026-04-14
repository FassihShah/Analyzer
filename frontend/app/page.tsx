"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock3, FileWarning, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Applicant, JobProfile } from "@/types/domain";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);

  useEffect(() => {
    apiFetch<JobProfile[]>("/jobs").then(setJobs).catch(() => setJobs([]));
    apiFetch<Applicant[]>("/applicants").then(setApplicants).catch(() => setApplicants([]));
  }, []);

  const metrics = useMemo(() => {
    const decisions = applicants.map((item) => item.system_outputs?.final_candidate_decision);
    const items: Array<[string, number, LucideIcon]> = [
      ["Imported applicants", applicants.length, Users],
      ["Shortlisted", decisions.filter((item) => item === "shortlist").length, CheckCircle2],
      ["Manual review", decisions.filter((item) => item === "review").length, Clock3],
      ["Rejected", decisions.filter((item) => item === "reject").length, FileWarning],
      ["Failed analyses", applicants.filter((item) => item.processing_status === "failed").length, FileWarning]
    ];
    return items;
  }, [applicants]);

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Multi-pass candidate evaluation"
        title="Dashboard"
        description="Track imports, analysis status, and candidate decisions across active job profiles."
      />
      <section className="grid gap-4 md:grid-cols-5">
        {metrics.map(([label, value, Icon]) => (
          <Card className="min-h-32" key={label as string}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-[#65706a]">{label}</p>
              <Icon className="text-moss" size={20} />
            </div>
            <p className="mt-5 text-3xl font-bold">{value}</p>
          </Card>
        ))}
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent jobs</h2>
            <Link className="text-sm font-semibold text-moss" href="/jobs">Manage</Link>
          </div>
          <div className="mt-4 space-y-3">
            {jobs.slice(0, 5).map((job) => (
              <Link className="flex items-center justify-between gap-4 rounded-lg border border-line p-4 transition hover:border-moss hover:bg-paper" href={`/jobs?job=${job.id}`} key={job.id}>
                <div>
                <p className="font-semibold">{job.title}</p>
                <p className="text-sm text-[#65706a]">{job.role_level} | {job.status}</p>
                </div>
                <ArrowRight size={16} className="text-[#8c958f]" />
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent applicants</h2>
            <Link className="text-sm font-semibold text-moss" href="/applicants">Review</Link>
          </div>
          <div className="mt-4 space-y-3">
            {applicants.slice(0, 6).map((applicant) => (
              <Link className="flex items-center justify-between gap-4 rounded-lg border border-line p-4 transition hover:border-moss hover:bg-paper" href={`/applicants/${applicant.id}`} key={applicant.id}>
                <div>
                <p className="font-semibold">{applicant.candidate_name ?? "Unnamed candidate"}</p>
                <p className="text-sm text-[#65706a]">{applicant.system_outputs?.final_candidate_score ?? "No score"} | {applicant.processing_status}</p>
                </div>
                <ArrowRight size={16} className="text-[#8c958f]" />
              </Link>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}
