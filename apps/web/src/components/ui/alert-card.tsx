import Link from "next/link";
import { AlertRecord } from "@/lib/types";
import { StatusBadge } from "./status-badge";

export function AlertCard({ alert }: { alert: AlertRecord }) {
  return (
    <article className="rounded-[1.4rem] border border-[var(--border)] bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge value={alert.priority} />
        <StatusBadge value={alert.status} tone={alert.status === "NEW" ? "danger" : undefined} />
      </div>
      <p className="mt-3 text-sm font-semibold">{alert.message}</p>
      <div className="mt-3 flex flex-wrap gap-3 text-xs text-[var(--muted)]">
        <span>{new Date(alert.alertDate).toLocaleDateString()}</span>
        {alert.workstation ? <span>Workstation: {alert.workstation.code}</span> : null}
        {alert.asset ? (
          <Link href={`/assets/${alert.asset.id}`} className="text-[var(--accent)]">
            Asset: {alert.asset.assetCode}
          </Link>
        ) : null}
      </div>
    </article>
  );
}
