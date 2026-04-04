import Link from "next/link";
import { ReplacementRecord } from "@/lib/types";

function getReplacementRecordStatus(record: ReplacementRecord) {
  const expected = record.repair?.expectedReturnDate;
  if (record.isReturned) return "RETURNED";
  if (record.replacementType === "PERMANENT") return "PERMANENT";
  if (expected && new Date(expected) < new Date()) return "OVERDUE";
  return "ACTIVE";
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function replacementLocation(record: ReplacementRecord) {
  return (
    record.toLocation ??
    record.originalAsset.currentLocation ??
    record.workstationCode ??
    record.workstation.code
  );
}

export function ReplacementRecordsList({
  records,
  statusFilter,
  searchQuery
}: {
  records: ReplacementRecord[];
  statusFilter?: string;
  searchQuery?: string;
}) {
  const normalizedFilter = statusFilter?.trim().toLowerCase();
  const normalizedQuery = searchQuery?.trim().toLowerCase() ?? "";
  const activeCount = records.filter((record) => getReplacementRecordStatus(record) === "ACTIVE").length;
  const returnedCount = records.filter((record) => getReplacementRecordStatus(record) === "RETURNED").length;
  const permanentCount = records.filter((record) => getReplacementRecordStatus(record) === "PERMANENT").length;
  const overdueCount = records.filter((record) => getReplacementRecordStatus(record) === "OVERDUE").length;

  const filteredRecords = records.filter((record) => {
    const operationalStatus = getReplacementRecordStatus(record).toLowerCase();
    const matchesStatus = !normalizedFilter || normalizedFilter === "all" || operationalStatus === normalizedFilter;
    const matchesQuery =
      !normalizedQuery ||
      [
        record.originalAsset.assetCode,
        record.replacementAsset.assetCode,
        replacementLocation(record),
        record.replacementType,
        record.reason ?? "",
        record.workstationCode ?? "",
        record.workstation.code
      ]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery));

    return matchesStatus && matchesQuery;
  });

  const tabs = [
    { label: "Active", value: "active" },
    { label: "Returned", value: "returned" },
    { label: "Permanent", value: "permanent" },
    { label: "All", value: "all" }
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              Replacement Operations
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--nav)]">
              Replacement records
            </h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Monitor active, returned, and permanent replacement activity without leaving the browsing view.
            </p>
          </div>

          <Link
            href="/replacements"
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
          >
            Create Replacement
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active Replacements", value: activeCount },
          { label: "Returned Replacements", value: returnedCount },
          { label: "Permanent Replacements", value: permanentCount },
          { label: "Overdue Replacements", value: overdueCount }
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-4 py-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-4 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            {tabs.map((tab) => {
              const isActive =
                (normalizedFilter === undefined && tab.value === "active") ||
                normalizedFilter === tab.value;
              const href = tab.value === "all"
                ? `/replacements?status=all${normalizedQuery ? `&q=${encodeURIComponent(normalizedQuery)}` : ""}`
                : `/replacements?status=${tab.value}${normalizedQuery ? `&q=${encodeURIComponent(normalizedQuery)}` : ""}`;

              return (
                <Link
                  key={tab.value}
                  href={href}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "border-[var(--nav)] bg-[var(--nav)] text-white"
                      : "border-[var(--border)] bg-white text-[var(--nav)] hover:bg-[var(--panel-strong)]"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>

          <form method="get" className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="status" value={normalizedFilter || "active"} />
            <label className="grid gap-2 text-sm">
              <span className="font-medium text-[var(--text)]">Search Replacement Records</span>
              <input
                type="search"
                name="q"
                defaultValue={searchQuery ?? ""}
                placeholder="Original asset, replacement asset, location, or reason"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>
            <div className="flex items-end gap-3">
              <button
                type="submit"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
              >
                Apply
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm">
        <div className="space-y-2">
          {filteredRecords.map((record) => {
            const operationalStatus = getReplacementRecordStatus(record);

            return (
              <Link
                key={record.id}
                href={`/replacements/new?assetId=${encodeURIComponent(record.originalAsset.id)}`}
                className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-white hover:shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Original Asset
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--nav)]">
                        {record.originalAsset.assetCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Replacement Asset
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                        {record.replacementAsset.assetCode}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Location
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">
                        {replacementLocation(record)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Replacement Type
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">
                        {record.replacementType.replaceAll("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Status
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">
                        {operationalStatus}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Replacement Date
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">
                        {formatDate(record.replacementDate)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}

          {filteredRecords.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-10 text-center">
              <p className="text-base font-semibold text-[var(--nav)]">
                {normalizedFilter === "active"
                  ? "No active replacements yet."
                  : "No replacement records match the current view."}
              </p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Temporary and permanent replacement records will appear here after a replacement is created.
              </p>
              <div className="mt-5">
                <Link
                  href="/replacements"
                  className="inline-flex items-center justify-center rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#214067]"
                >
                  Create Replacement
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
