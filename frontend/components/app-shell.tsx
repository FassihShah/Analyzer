"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, ChevronDown, FileDown, FileUp, LayoutDashboard, Mail, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { DEMO_MODE } from "@/lib/api";
import { resetDemo } from "@/lib/demo";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/imports", label: "Imports", icon: FileUp },
  { href: "/applicants", label: "Applicants", icon: Users },
  { href: "/emails", label: "Emails", icon: Mail },
  { href: "/exports", label: "Exports", icon: FileDown },
  { href: "/analytics", label: "Analytics", icon: BarChart3 }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/login";
  if (hideNav) return <>{children}</>;
  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col border-r border-line bg-white lg:flex">
        <Link href="/" className="flex h-[76px] items-center gap-3 border-b border-line px-6" aria-label="DYOS AI Hiring home">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#123344] text-lg font-bold text-white">D</span>
          <span><span className="block text-[15px] font-bold tracking-tight text-ink">DYOS Hiring</span><span className="block text-xs text-[var(--muted)]">Recruitment workspace</span></span>
        </Link>
        <div className="mx-4 mt-5 flex items-center justify-between rounded-md border border-line bg-paper px-3 py-2.5 text-xs font-semibold text-ink">
          <span>Hiring workspace</span><ChevronDown size={14} aria-hidden="true" />
        </div>
        <p className="mb-2 mt-7 px-6 text-[11px] font-semibold uppercase tracking-[.1em] text-[var(--muted)]">Workspace</p>
        <nav aria-label="Primary navigation" className="space-y-1 px-3">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-[#51616e] transition-colors hover:bg-paper hover:text-ink",
                  active && "bg-[#e9f3f6] font-semibold text-moss"
                )}
              >
                <Icon size={17} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-line px-5 py-5">
          <p className="text-sm font-semibold text-ink">Evidence-led hiring</p>
          <p className="mt-1 text-xs leading-5 text-[var(--muted)]">Human review stays at the center of every decision.</p>
        </div>
      </aside>
      <header className="sticky top-0 z-20 border-b border-line bg-white lg:ml-[248px]">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-7">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#123344] font-bold text-white lg:hidden">D</span>
            <span className="text-sm font-semibold text-ink lg:text-[var(--muted)]">{nav.find((item) => item.href === pathname || (item.href !== "/" && pathname.startsWith(item.href)))?.label ?? "Workspace"}</span>
          </div>
          <span className="rounded-full border border-[#c9e3de] bg-[#edf8f5] px-3 py-1 text-xs font-semibold text-[#1c695e]">Recruiter workspace</span>
        </div>
        <nav aria-label="Mobile navigation" className="flex gap-1 overflow-x-auto border-t border-line px-3 py-2 lg:hidden">
          {nav.map((item) => <Link key={item.href} href={item.href} className={cn("shrink-0 rounded-md px-3 py-2 text-xs font-semibold text-[var(--muted)]", (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))) && "bg-[#e9f3f6] text-moss")}>{item.label}</Link>)}
        </nav>
      </header>
      {DEMO_MODE && <div className="border-b border-[#c9dce3] bg-[#eaf4f7] px-4 py-2.5 text-xs text-[#24566a] lg:ml-[248px] sm:px-7"><div className="mx-auto flex max-w-[1480px] flex-wrap items-center justify-between gap-2"><p><strong>Portfolio demo</strong> · Synthetic data only. Actions are simulated in this browser; no AI analysis or emails are sent. Do not upload real personal data.</p><button type="button" className="focus-ring font-semibold underline" onClick={() => { resetDemo(); window.location.reload(); }}>Reset demo</button></div></div>}
      <main className="lg:pl-[248px]">
        <div className="mx-auto max-w-[1480px] px-4 py-7 sm:px-7 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
