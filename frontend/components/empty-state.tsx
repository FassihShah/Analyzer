import type { ReactNode } from "react";

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="py-8 text-center"><p className="text-sm font-semibold text-ink">{title}</p><p className="mt-1 text-sm text-[var(--muted)]">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}
