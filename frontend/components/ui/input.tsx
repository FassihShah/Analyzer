import * as React from "react";

import { cn } from "@/lib/utils";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "focus-ring min-h-10 w-full rounded-md border border-line bg-white px-3 py-2 text-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] placeholder:text-[#8c958f]",
        props.className
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn("focus-ring w-full rounded-md border border-line bg-white px-3 py-2 text-sm placeholder:text-[#8c958f]", props.className)}
    />
  );
}
