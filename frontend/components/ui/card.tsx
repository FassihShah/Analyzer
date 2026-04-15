import * as React from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border border-line bg-white/90 p-5 shadow-[0_18px_60px_rgba(21,36,38,0.08)] backdrop-blur", className)} {...props} />;
}
