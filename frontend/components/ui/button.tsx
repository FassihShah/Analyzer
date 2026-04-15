import * as React from "react";

import { cn } from "@/lib/utils";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "focus-ring inline-flex min-h-10 items-center justify-center rounded-lg bg-moss px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60",
        "shadow-[0_10px_24px_rgba(20,122,108,0.22)] hover:bg-[#10685d] active:translate-y-px",
        className
      )}
      {...props}
    />
  );
}
