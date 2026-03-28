import { StatusTone } from "@/lib/types";

const toneClasses: Record<StatusTone, string> = {
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-700",
  neutral: "bg-slate-100 text-slate-700",
  info: "bg-blue-100 text-blue-700"
};

const statusToneMap: Record<string, StatusTone> = {
  ACTIVE: "success",
  RETURNED: "success",
  CLOSED: "success",
  RESOLVED: "success",
  NEW: "danger",
  HIGH: "danger",
  IN_REPAIR: "danger",
  OVERDUE: "danger",
  NEEDS_ATTENTION: "warning",
  TEMPORARY_REPLACEMENT: "warning",
  REPORTED: "warning",
  SENT: "warning",
  IN_PROGRESS: "warning",
  PENDING_RESTORE: "warning",
  MEDIUM: "warning",
  READ: "info",
  IN_STORE: "neutral",
  REMOVED: "neutral",
  INACTIVE: "neutral",
  LOW: "neutral"
};

function formatLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function StatusBadge({ value, tone }: { value: string; tone?: StatusTone }) {
  const resolvedTone = tone ?? statusToneMap[value] ?? "neutral";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${toneClasses[resolvedTone]}`}>
      {formatLabel(value)}
    </span>
  );
}
