import * as React from "react";

import { cn } from "@/lib/utils";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-moss px-4 py-2 text-sm font-semibold leading-none text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        "hover:bg-[var(--accent-hover)] active:bg-[var(--accent-hover)]",
        className
      )}
      {...props}
    />
  );
}
