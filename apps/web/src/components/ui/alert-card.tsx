"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAlert as updateAlertRequest } from "@/lib/api";
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

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.8" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="m5 12 4.2 4.2L19 6.5" />
    </svg>
  );
}

function DismissIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="m7 7 10 10" />
      <path d="M17 7 7 17" />
    </svg>
  );
}

export function AlertCard({
  alert,
  showActions = false
}: {
  alert: AlertRecord;
  showActions?: boolean;
}) {
  const router = useRouter();
  const [pendingAction, setPendingAction] = useState<"read" | "dismiss" | null>(null);
  const [isPending, startTransition] = useTransition();

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

  const runAction = (action: "read" | "dismiss") => {
    setPendingAction(action);
    startTransition(async () => {
      try {
        await updateAlertRequest(alert.id, { action });
        router.refresh();
      } finally {
        setPendingAction(null);
      }
    });
  };

  return (
    <article className="group relative overflow-hidden rounded-[1.6rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] p-4 shadow-[0_18px_50px_rgba(24,49,83,0.08)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_24px_80px_rgba(24,49,83,0.13)]">
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
        <div className="text-right">
          <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
            {new Date(alert.alertDate).toLocaleDateString()}
          </span>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Alert date</p>
        </div>
      </div>

      <p className="relative mt-4 pl-3 text-base font-semibold leading-7 text-[var(--text)]">{alert.message}</p>

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

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 pl-3">
        <Link
          href="/alerts"
          className="inline-flex items-center gap-2 rounded-full bg-[var(--nav)] px-4 py-2 text-xs font-semibold text-white shadow-[0_12px_24px_rgba(24,49,83,0.18)] transition hover:bg-[#214067]"
        >
          <EyeIcon />
          Review
        </Link>

        {showActions ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runAction("read")}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)] disabled:opacity-60"
            >
              <CheckIcon />
              {pendingAction === "read" ? "Updating..." : "Mark as read"}
            </button>
            <button
              type="button"
              onClick={() => runAction("dismiss")}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-900 transition hover:bg-rose-100 disabled:opacity-60"
            >
              <DismissIcon />
              {pendingAction === "dismiss" ? "Dismissing..." : "Dismiss alert"}
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
