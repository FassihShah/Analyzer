import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  completed: "bg-[#e5f3ed] text-[#245b45]",
  shortlist: "bg-[#e5f3ed] text-[#245b45]",
  review: "bg-[#fff1d4] text-[#775616]",
  reject: "bg-[#f8ded8] text-[#8a352b]",
  failed: "bg-[#f8ded8] text-[#8a352b]",
  running: "bg-[#e9eef0] text-[#30494f]",
  queued: "bg-[#edf1dc] text-[#64732a]",
  pending: "bg-[#eeeeea] text-[#555a55]"
};

export function StatusBadge({ value }: { value?: string }) {
  const label = value || "unknown";
  return <span className={cn("inline-flex rounded-md px-2 py-1 text-xs font-semibold", styles[label] ?? styles.pending)}>{label}</span>;
}
