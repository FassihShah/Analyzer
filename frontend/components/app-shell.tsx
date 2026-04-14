"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, BriefcaseBusiness, FileDown, FileUp, LayoutDashboard, Users } from "lucide-react";

import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: BriefcaseBusiness },
  { href: "/imports", label: "Imports", icon: FileUp },
  { href: "/applicants", label: "Applicants", icon: Users },
  { href: "/exports", label: "Exports", icon: FileDown },
  { href: "/analytics", label: "Analytics", icon: BarChart3 }
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideNav = pathname === "/login";
  if (hideNav) return <>{children}</>;
  return (
    <div className="min-h-screen">
      <aside className="fixed left-0 top-0 hidden h-screen w-72 border-r border-line bg-white/95 p-5 shadow-sm lg:block">
        <div className="rounded-lg border border-line bg-paper/70 p-3">
          <div className="flex items-center gap-3">
            <Image
              src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=96&q=80"
              alt="Documents"
              width={44}
              height={44}
              className="h-11 w-11 rounded-lg object-cover"
            />
            <div>
              <p className="text-sm font-bold text-ink">Resume Intelligence</p>
              <p className="text-xs text-[#65706a]">Recruiter console</p>
            </div>
          </div>
        </div>
        <div className="mt-5 rounded-lg border border-line bg-[#e5f3ed] p-4">
          <p className="text-xs font-semibold uppercase tracking-normal text-moss">Evaluation mode</p>
          <p className="mt-2 text-sm font-semibold text-ink">Multi-pass LLM review</p>
          <p className="mt-1 text-xs leading-5 text-[#65706a]">Coded prompts and rubrics, simple job setup.</p>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[#4d5752] transition hover:bg-paper",
                  active && "bg-[#e5f3ed] text-moss shadow-[inset_3px_0_0_#2f6f56]"
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
          <p className="text-sm font-bold text-ink">Resume Intelligence</p>
          <Link className="rounded-lg bg-moss px-3 py-2 text-xs font-semibold text-white" href="/applicants">Applicants</Link>
        </div>
      </header>
      <main className="lg:pl-72">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
