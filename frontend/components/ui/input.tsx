import * as React from "react";

import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "focus-ring min-h-10 w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink transition-colors placeholder:text-[var(--muted)] hover:border-[var(--line-strong)]",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn("focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink transition-colors placeholder:text-[var(--muted)] hover:border-[var(--line-strong)]", props.className)}
    />
  );
}
