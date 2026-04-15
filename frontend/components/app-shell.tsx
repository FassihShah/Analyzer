"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, FileDown, FileUp, LayoutDashboard, Mail, Users } from "lucide-react";

import { cn } from "@/lib/utils";

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
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-line bg-white/88 p-5 shadow-[16px_0_60px_rgba(21,36,38,0.08)] backdrop-blur-xl lg:block">
        <div className="rounded-lg border border-line bg-white p-3 shadow-[0_16px_36px_rgba(21,36,38,0.08)]">
          <div className="flex items-center gap-3">
            <Image
              src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=96&q=80"
              alt="Workspace"
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-black text-ink">DYOS AI Hiring</p>
              <p className="text-xs font-medium text-[#63736f]">Recruiter console</p>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-[#b9ddd5] bg-[#e9f8f4] p-4 shadow-[0_14px_36px_rgba(20,122,108,0.12)]">
          <p className="text-xs font-bold uppercase tracking-normal text-moss">Evaluation mode</p>
          <p className="mt-2 text-sm font-black text-ink">Evidence-led screening</p>
          <p className="mt-1 text-xs leading-5 text-[#63736f]">Job-specific analysis, draft review, and export in one flow.</p>
        </div>
        <nav className="mt-8 space-y-1">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-[#4f5f5b] transition hover:bg-paper hover:text-ink",
                  active && "bg-[#e9f8f4] text-moss shadow-[inset_3px_0_0_#147a6c]"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <header className="sticky top-0 z-20 border-b border-line bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm font-black text-ink">DYOS AI Hiring</p>
          <Link className="rounded-lg bg-moss px-3 py-2 text-xs font-semibold text-white" href="/applicants">Applicants</Link>
        </div>
      </header>
      <main className="lg:pl-72">
        <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
