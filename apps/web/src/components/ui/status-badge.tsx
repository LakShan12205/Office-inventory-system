import { StatusTone } from "@/lib/types";

const toneClasses: Record<StatusTone, string> = {
  success: "border border-emerald-200 bg-emerald-100 text-emerald-900 shadow-sm",
  warning: "border border-amber-200 bg-amber-100 text-amber-900 shadow-sm",
  danger: "border border-rose-200 bg-rose-100 text-rose-900 shadow-sm",
  neutral: "border border-slate-200 bg-slate-100 text-slate-800 shadow-sm",
  info: "border border-blue-200 bg-blue-100 text-blue-800 shadow-sm"
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
