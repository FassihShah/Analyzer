import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-lg border border-line bg-white/80 p-5 shadow-[0_18px_60px_rgba(21,36,38,0.08)] backdrop-blur md:p-6", className)}>
      <div className="absolute inset-y-0 left-0 w-1 bg-moss" />
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <p className="text-xs font-bold uppercase tracking-normal text-moss">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-ink md:text-4xl">{title}</h1>
        {description && <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5f6f6b]">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
