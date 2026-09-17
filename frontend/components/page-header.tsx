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
    <div className={cn("flex flex-col justify-between gap-4 border-b border-line pb-5 md:flex-row md:items-end", className)}>
        <div>
          <p className="text-xs font-semibold text-moss">{eyebrow}</p>
          <h1 className="mt-2 text-[1.75rem] font-bold tracking-[-0.035em] text-ink sm:text-[2rem]">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
