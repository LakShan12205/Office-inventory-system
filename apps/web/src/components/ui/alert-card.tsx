import Link from "next/link";
import { AlertRecord } from "@/lib/types";
import { StatusBadge } from "./status-badge";

function PriorityIcon({ priority }: { priority: string }) {
  const iconClass = "h-5 w-5 fill-none stroke-current stroke-[1.8]";

  if (priority === "HIGH") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <path d="M12 3 3.5 19h17L12 3Z" />
        <path d="M12 9v4.5" />
        <path d="M12 16.8h.01" />
      </svg>
    );
  }

  if (priority === "MEDIUM") {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <path d="M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z" />
        <path d="M12 8.5v4.5" />
        <path d="M12 15.8h.01" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={iconClass}>
      <path d="M12 6.5v11" />
      <path d="M17.5 12h-11" />
      <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
    </svg>
  );
}

export function AlertCard({ alert }: { alert: AlertRecord }) {
  const priorityBar = {
    HIGH: "bg-[var(--danger)]",
    MEDIUM: "bg-[var(--warning)]",
    LOW: "bg-[var(--nav)]"
  }[alert.priority] ?? "bg-[var(--nav)]";

  const priorityTone = {
    HIGH: "bg-rose-50 text-[var(--danger)]",
    MEDIUM: "bg-amber-50 text-[var(--warning)]",
    LOW: "bg-slate-100 text-[var(--nav)]"
  }[alert.priority] ?? "bg-slate-100 text-[var(--nav)]";

  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] p-4 shadow-[0_18px_50px_rgba(24,49,83,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(24,49,83,0.13)]">
      <div className={`absolute inset-y-0 left-0 w-1.5 ${priorityBar}`} />
      <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-[var(--panel-strong)]/70 blur-2xl transition duration-300 group-hover:bg-[var(--panel-strong)]" />
      <div className="relative flex items-start justify-between gap-4 pl-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${priorityTone}`}>
            <PriorityIcon priority={alert.priority} />
          </span>
          <StatusBadge value={alert.priority} />
          <StatusBadge value={alert.status} tone={alert.status === "NEW" ? "danger" : undefined} />
        </div>
        <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
          {new Date(alert.alertDate).toLocaleDateString()}
        </span>
      </div>

      <p className="relative mt-4 pl-3 text-sm font-semibold leading-6 text-[var(--text)]">{alert.message}</p>

      <div className="relative mt-4 flex flex-wrap gap-3 pl-3 text-xs text-[var(--muted)]">
        {alert.workstation ? (
          <span className="rounded-full bg-slate-50 px-3 py-1">Workstation: {alert.workstation.code}</span>
        ) : null}
        {alert.asset ? (
          <Link href={`/assets/${alert.asset.id}`} className="rounded-full bg-amber-50 px-3 py-1 text-[var(--accent)] transition hover:bg-amber-100">
            Asset: {alert.asset.assetCode}
          </Link>
        ) : null}
      </div>

      <div className="relative mt-4 flex justify-end pl-3">
        <Link
          href="/alerts"
          className="rounded-full border border-[var(--border)] bg-white/80 px-3.5 py-2 text-xs font-semibold text-[var(--nav)] transition hover:border-[#d7c2a6] hover:bg-[var(--panel-strong)]"
        >
          Review
        </Link>
      </div>
    </article>
  );
}
