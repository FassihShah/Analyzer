"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BriefcaseBusiness, CheckCircle2, Clock3, FileUp, Mail, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Applicant, CandidateEmail, JobProfile } from "@/types/domain";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobProfile[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [emails, setEmails] = useState<CandidateEmail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<JobProfile[]>("/jobs"),
      apiFetch<Applicant[]>("/applicants"),
      apiFetch<CandidateEmail[]>("/candidate-emails")
    ]).then(([jobData, applicantData, emailData]) => {
      setJobs(jobData);
      setApplicants(applicantData);
      setEmails(emailData);
    }).catch((reason) => setError(reason instanceof Error ? reason.message : "The workspace could not be loaded.")).finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => ({
    shortlisted: applicants.filter((item) => item.system_outputs?.final_candidate_decision === "shortlist").length,
    review: applicants.filter((item) => item.system_outputs?.final_candidate_decision === "review").length,
    drafts: emails.filter((item) => item.status === "draft").length,
    activeJobs: jobs.filter((item) => item.status === "active").length
  }), [applicants, emails, jobs]);

  return (
    <div className="space-y-7">
      <PageHeader eyebrow="Recruitment overview" title="Dashboard" description="A clear view of your hiring pipeline, from intake to final review." action={<Link href="/imports" className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-md bg-moss px-4 text-sm font-semibold text-white hover:bg-[var(--accent-hover)]"><FileUp size={17} /> Import applicants</Link>} />

      {error && <div role="alert" className="rounded-lg border border-[#e8b9b4] bg-[#fff3f1] p-4 text-sm text-[#8e3932]"><p className="font-semibold">Workspace unavailable</p><p className="mt-1">{error}</p></div>}

      <section aria-label="Hiring metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total applicants", value: applicants.length, icon: Users, href: "/applicants", note: "Across all job profiles" },
          { label: "Shortlisted", value: summary.shortlisted, icon: CheckCircle2, href: "/applicants", note: "Ready for next steps" },
          { label: "Needs review", value: summary.review, icon: Clock3, href: "/applicants", note: "Awaiting a recruiter" },
          { label: "Active roles", value: summary.activeJobs, icon: BriefcaseBusiness, href: "/jobs", note: "Open job profiles" }
        ].map((metric) => {
          const Icon = metric.icon;
          return <Link key={metric.label} href={metric.href} className="focus-ring group rounded-lg border border-line bg-white p-5 shadow-[var(--shadow)] transition-colors hover:border-[var(--line-strong)]">
            <div className="flex items-center justify-between"><span className="text-sm font-medium text-[var(--muted)]">{metric.label}</span><Icon size={19} className="text-moss" aria-hidden="true" /></div>
            <p className="mt-5 text-[2rem] font-bold leading-none tracking-tight text-ink">{loading ? "…" : metric.value}</p>
            <p className="mt-3 text-xs text-[var(--muted)]">{metric.note}</p>
          </Link>;
        })}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
        <Card className="p-0">
          <div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-base font-bold">Recent applicants</h2><p className="mt-1 text-xs text-[var(--muted)]">Latest candidates in your workspace</p></div><Link className="focus-ring inline-flex items-center gap-1 text-sm font-semibold text-moss hover:underline" href="/applicants">View all <ArrowRight size={15} /></Link></div>
          {applicants.length ? <div className="divide-y divide-line">
            {applicants.slice(0, 6).map((applicant) => <Link href={`/applicants/${applicant.id}`} key={applicant.id} className="focus-ring flex items-center justify-between gap-4 px-5 py-4 hover:bg-paper">
              <div className="min-w-0"><p className="truncate text-sm font-semibold text-ink">{applicant.candidate_name || "Unnamed candidate"}</p><p className="mt-1 truncate text-xs text-[var(--muted)]">{applicant.applied_role || applicant.job_title || "Role not assigned"}</p></div>
              <div className="flex shrink-0 items-center gap-4"><span className="hidden text-sm font-semibold text-ink sm:block">{applicant.system_outputs?.final_candidate_score ?? "—"}</span><StatusBadge value={applicant.system_outputs?.final_candidate_decision ?? applicant.processing_status} /></div>
            </Link>)}
          </div> : <div className="px-5 py-12 text-center"><Users className="mx-auto text-[var(--muted)]" size={25} /><p className="mt-3 text-sm font-semibold">No applicants yet</p><p className="mt-1 text-xs text-[var(--muted)]">Import a CSV to start reviewing candidates.</p><Link href="/imports" className="mt-4 inline-flex text-sm font-semibold text-moss hover:underline">Go to imports</Link></div>}
        </Card>
        <div className="space-y-5">
          <Card className="p-0"><div className="flex items-center justify-between border-b border-line px-5 py-4"><div><h2 className="text-base font-bold">Open roles</h2><p className="mt-1 text-xs text-[var(--muted)]">Profiles guiding evaluation</p></div><Link className="focus-ring text-sm font-semibold text-moss hover:underline" href="/jobs">Manage</Link></div>
            {jobs.length ? <div className="divide-y divide-line">{jobs.slice(0, 4).map((job) => <Link href={`/jobs?job=${job.id}`} key={job.id} className="focus-ring flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-paper"><span className="min-w-0"><span className="block truncate text-sm font-semibold">{job.title}</span><span className="mt-1 block text-xs text-[var(--muted)]">{job.department || job.role_level || "Job profile"}</span></span><StatusBadge value={job.status} /></Link>)}</div> : <p className="px-5 py-8 text-sm text-[var(--muted)]">No job profiles yet. <Link className="font-semibold text-moss hover:underline" href="/jobs">Create one</Link> to begin.</p>}
          </Card>
          <Card className="flex items-start gap-4 bg-[#f0f7f8]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#dcecf0] text-moss"><Mail size={19} /></span><div><p className="text-sm font-bold">Communication queue</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{summary.drafts} email {summary.drafts === 1 ? "draft" : "drafts"} waiting for review before sending.</p><Link href="/emails" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-moss hover:underline">Review drafts <ArrowRight size={15} /></Link></div></Card>
        </div>
      </section>
    </div>
  );
}
