"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, Clock3, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import type { Applicant } from "@/types/domain";

export default function AnalyticsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiFetch<Applicant[]>("/applicants").then(setApplicants).catch((reason) => setError(reason instanceof Error ? reason.message : "Analytics could not be loaded.")).finally(() => setLoading(false));
  }, []);

  const averages = useMemo(() => {
    const scores = applicants.map((item) => Number(item.system_outputs?.final_candidate_score)).filter(Number.isFinite);
    const avg = scores.length ? Math.round(scores.reduce((sum, item) => sum + item, 0) / scores.length) : 0;
    return { avg, scored: scores.length, shortlist: applicants.filter((item) => item.system_outputs?.final_candidate_decision === "shortlist").length, review: applicants.filter((item) => item.system_outputs?.final_candidate_decision === "review").length };
  }, [applicants]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Hiring signal overview"
        title="Analytics"
        description="Understand screening coverage and the balance of candidate decisions."
      />
      {error && <p role="alert" className="rounded-lg border border-[#e8b9b4] bg-[#fff3f1] p-4 text-sm text-[#8e3932]">{error}</p>}
      <section aria-label="Screening metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Average score", value: averages.avg, Icon: BarChart3 },
          { label: "Scored candidates", value: averages.scored, Icon: Users },
          { label: "Shortlisted", value: averages.shortlist, Icon: CheckCircle2 },
          { label: "Needs review", value: averages.review, Icon: Clock3 }
        ].map(({ label, value, Icon }) => (
          <Card className="min-h-32" key={label}>
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-[var(--muted)]">{label}</p>
              <Icon className="text-moss" size={19} aria-hidden="true" />
            </div>
            <p className="mt-5 text-3xl font-bold tracking-tight">{loading ? "…" : value}</p>
          </Card>
        ))}
      </section>
      <Card className="max-w-3xl"><h2 className="text-base font-bold">Scoring coverage</h2><p className="mt-1 text-sm text-[var(--muted)]">Candidates with a completed final score</p><div className="mt-5 flex items-end justify-between gap-4"><p className="text-3xl font-bold tracking-tight">{loading ? "…" : applicants.length ? `${Math.round(averages.scored / applicants.length * 100)}%` : "0%"}</p><p className="text-sm text-[var(--muted)]">{averages.scored} of {applicants.length} candidates</p></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#e7edf0]"><div className="h-full rounded-full bg-moss" style={{ width: `${applicants.length ? averages.scored / applicants.length * 100 : 0}%` }} /></div>{!loading && !applicants.length && <p className="mt-5 text-sm text-[var(--muted)]">No applicant data yet. Import candidates to see hiring analytics.</p>}</Card>
    </div>
  );
}
