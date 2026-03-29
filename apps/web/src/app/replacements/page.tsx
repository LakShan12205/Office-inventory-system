import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getReplacements } from "@/lib/api";

type ReplacementPageRecord = {
  id: string;
  status: string;
  replacementDate: string;
  replacementReturnDate?: string | null;
  originalAsset: {
    id: string;
    assetCode: string;
  };
  replacementAsset: {
    id: string;
    assetCode: string;
  };
  workstation: {
    id: string;
    code: string;
  };
  repair?: {
    id: string;
    status: string;
    expectedReturnDate?: string | null;
    actualReturnDate?: string | null;
  };
};

function formatReplacementStatus(status: string) {
  if (status === "ACTIVE") return "IN_USE";
  if (status === "PENDING_RESTORE") return "AWAITING_RETURN";
  return status;
}

function daysBetween(start: string) {
  const now = new Date();
  const then = new Date(start);
  const diff = Math.max(0, now.getTime() - then.getTime());
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function ActionButton({
  href,
  label,
  tone = "light"
}: {
  href: string;
  label: string;
  tone?: "light" | "dark";
}) {
  return (
    <Link
      href={href}
      className={`inline-flex rounded-full px-3 py-2 text-xs font-semibold transition ${
        tone === "dark"
          ? "bg-[var(--nav)] text-white hover:bg-[#214067]"
          : "border border-[var(--border)] bg-white text-[var(--nav)] hover:bg-[var(--panel-strong)]"
      }`}
    >
      {label}
    </Link>
  );
}

export default async function ReplacementsPage() {
  const replacements = (await getReplacements()) as ReplacementPageRecord[];
  const activeCount = replacements.filter((replacement) => replacement.status === "ACTIVE").length;
  const pendingRestoreCount = replacements.filter((replacement) => replacement.status === "PENDING_RESTORE").length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Temporary replacements"
        description="See which workstations are using replacement machines, when they were assigned, and whether the original machine has already returned."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Active replacements</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{activeCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Pending restore</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{pendingRestoreCount}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Total replacements</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{replacements.length}</p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <DataTable
          stickyHeader
          headers={[
            "Workstation",
            "Original machine",
            "Replacement",
            "Replacement date",
            "Status",
            "Days Active",
            "Original return",
            "Actions"
          ]}
        >
          {replacements.map((replacement, index) => {
            const daysActive = daysBetween(replacement.replacementDate);
            const isOverdue =
              replacement.status !== "REMOVED" &&
              !!replacement.repair?.expectedReturnDate &&
              !replacement.repair?.actualReturnDate &&
              new Date(replacement.repair.expectedReturnDate) < new Date();

            return (
            <tr
              key={replacement.id}
              className={`${index % 2 === 0 ? "bg-white" : "bg-[#fcf8f1]"} ${isOverdue ? "shadow-[inset_4px_0_0_rgba(196,73,73,0.65)]" : ""}`}
            >
              <td className="px-4 py-4 text-sm font-medium text-[var(--nav)]">
                <Link href={`/workstations/${replacement.workstation.id}`} className="hover:text-[var(--accent)]">
                  {replacement.workstation.code}
                </Link>
              </td>
              <td className="px-4 py-4 text-sm">
                <Link href={`/assets/${replacement.originalAsset.id}`} className="hover:text-[var(--accent)]">
                  {replacement.originalAsset.assetCode}
                </Link>
              </td>
              <td className="px-4 py-4 text-sm font-medium">
                <Link href={`/assets/${replacement.replacementAsset.id}`} className="hover:text-[var(--accent)]">
                  {replacement.replacementAsset.assetCode}
                </Link>
              </td>
              <td className="px-4 py-4 text-sm">
                {new Date(replacement.replacementDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-sm">
                <div className="flex flex-col items-start gap-2">
                  <StatusBadge
                    value={formatReplacementStatus(replacement.status)}
                    tone={replacement.status === "ACTIVE" ? "warning" : replacement.status === "PENDING_RESTORE" ? "danger" : undefined}
                  />
                  {isOverdue ? (
                    <span className="rounded-full bg-rose-100 px-3 py-1 text-[11px] font-semibold text-rose-900">
                      Overdue
                    </span>
                  ) : null}
                </div>
              </td>
              <td className="px-4 py-4 text-sm">
                <span className="font-medium text-[var(--text)]">{daysActive}</span>
                <span className="ml-1 text-[var(--muted)]">days</span>
              </td>
              <td className="px-4 py-4 text-sm">
                {replacement.replacementReturnDate
                  ? new Date(replacement.replacementReturnDate).toLocaleDateString()
                  : "Still away"}
              </td>
              <td className="px-4 py-4 text-sm">
                <div className="flex flex-wrap gap-2">
                  <ActionButton href={`/workstations/${replacement.workstation.id}`} label="Mark Returned" tone="dark" />
                  <ActionButton href="/repairs/new" label="Replace Again" />
                  <ActionButton href={`/assets/${replacement.replacementAsset.id}`} label="View Details" />
                </div>
              </td>
            </tr>
          )})}
        </DataTable>
      </div>
    </div>
  );
}
