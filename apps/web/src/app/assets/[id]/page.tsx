import Link from "next/link";
import { AlertCard } from "@/components/ui/alert-card";
import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAsset } from "@/lib/api";
import { AssetRecord } from "@/lib/types";

function formatDate(value?: string | null) {
  if (!value) return "Not recorded";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getAssetTypeIcon(type?: string | null) {
  const iconClass = "h-6 w-6 fill-none stroke-current stroke-[1.8]";
  const normalized = type?.toLowerCase() ?? "";

  if (normalized.includes("monitor") || normalized.includes("tv")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
        <path d="M9 19.5h6" />
        <path d="M12 15.5v4" />
      </svg>
    );
  }

  if (normalized.includes("machine")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="4.5" y="5.5" width="15" height="10" rx="2" />
        <path d="M8.5 18.5h7" />
        <path d="M12 15.5v3" />
      </svg>
    );
  }

  if (normalized.includes("ups")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="6" y="4.5" width="12" height="15" rx="2" />
        <path d="M10 9.5h4" />
        <path d="M10 13.5h4" />
      </svg>
    );
  }

  if (normalized.includes("keyboard") || normalized.includes("mouse")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="3.5" y="8.5" width="17" height="7" rx="2" />
        <path d="M7 12h.01" />
        <path d="M10 12h.01" />
        <path d="M13 12h.01" />
        <path d="M16 12h.01" />
      </svg>
    );
  }

  if (normalized.includes("tablet") || normalized.includes("phone")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="7" y="3.5" width="10" height="17" rx="2" />
        <path d="M11 17.5h2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={iconClass}>
      <path d="M4 8.5 12 5l8 3.5L12 12 4 8.5Z" />
      <path d="M4 12.5 12 16l8-3.5" />
      <path d="M4 16.5 12 20l8-3.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="m4 20 4.2-1 9.6-9.6a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="m13.5 6.5 4 4" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M14 6a4 4 0 0 0 4.7 4.7l-8.4 8.4a2 2 0 1 1-2.8-2.8l8.4-8.4A4 4 0 0 0 14 6Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M7 7h11" />
      <path d="m15 4 3 3-3 3" />
      <path d="M17 17H6" />
      <path d="m9 14-3 3 3 3" />
    </svg>
  );
}

function EmptyState({
  title,
  message
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/60 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-[var(--nav)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}

function ActionButton({
  href,
  label,
  icon,
  tone = "light"
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tone?: "light" | "dark";
}) {
  const className =
    tone === "dark"
      ? "inline-flex items-center gap-2 rounded-2xl bg-[var(--nav)] px-4 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(24,49,83,0.18)] transition hover:bg-[#214067]"
      : "inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-white/90 px-4 py-3 text-sm font-semibold text-[var(--nav)] transition hover:border-[#d7c2a6] hover:bg-[var(--panel-strong)]";

  return (
    <Link href={href} className={className}>
      {icon}
      {label}
    </Link>
  );
}

export default async function AssetDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = (await getAsset(id)) as AssetRecord;
  const repairs = asset.repairs ?? [];
  const alerts = asset.alerts ?? [];
  const isWorkstationAsset = asset.assetScope === "Workstation Device" || asset.workstationAssignments.some((assignment) => assignment.isActive);
  const activeAssignment = asset.workstationAssignments.find((assignment) => assignment.isActive) ?? asset.workstationAssignments[0];
  const currentLocation =
    asset.currentLocationDisplay ??
    asset.displayLocation ??
    (isWorkstationAsset
      ? [asset.workstationCode ?? activeAssignment?.workstation.code, asset.side].filter(Boolean).join(" / ")
      : asset.generalLocation ?? asset.currentLocation) ??
    "Not recorded";
  const assignmentSectionTitle = isWorkstationAsset ? "Assignment history" : "Location history";

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,255,255,0.94))] px-6 py-6 shadow-[0_22px_70px_rgba(24,49,83,0.08)]">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--accent)] via-[var(--nav)] to-transparent" />
        <div className="absolute -right-8 top-10 h-24 w-24 rounded-full bg-[var(--accent)]/10 blur-2xl" />
        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[linear-gradient(135deg,var(--nav),var(--accent))] text-white shadow-[0_18px_40px_rgba(24,49,83,0.18)]">
              {getAssetTypeIcon(asset.assetType.name)}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
                {asset.assetType.name}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--nav)]">
                {asset.assetCode}
              </h1>
              <p className="mt-2 text-sm text-[var(--muted)]">
                {asset.brand} {asset.model}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge value={asset.status} />
                {asset.assetScope ? <StatusBadge value={asset.assetScope} tone="info" /> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionButton
              href={`/assets?search=${encodeURIComponent(asset.assetCode)}`}
              label="Edit Asset"
              icon={<PencilIcon />}
            />
            <ActionButton
              href="/repairs/new"
              label="Log Repair"
              icon={<WrenchIcon />}
              tone="dark"
            />
            <ActionButton
              href="/replacements"
              label="Assign Replacement"
              icon={<SwapIcon />}
            />
          </div>
        </div>

        <div className="relative mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Asset Code", value: asset.assetCode },
            { label: "Type", value: asset.assetType.name },
            { label: "Status", value: asset.status.replaceAll("_", " ") },
            { label: "Asset Scope", value: asset.assetScope ?? (isWorkstationAsset ? "Workstation Device" : "Other / Non-Workstation Device") },
            { label: "Current Location", value: currentLocation }
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[1.35rem] border border-[var(--border)] bg-white/80 px-4 py-4"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--text)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Asset profile">
          <div className="grid gap-4 md:grid-cols-2">
            {[
              { label: "Type", value: asset.assetType.name },
              { label: "Status", value: <StatusBadge value={asset.status} /> },
              { label: "Brand / Model", value: `${asset.brand} ${asset.model}` },
              { label: "Serial number", value: asset.serialNumber },
              {
                label: "Purchase date",
                value: formatDate(asset.purchaseDate)
              },
              { label: "Warranty Expiry Date", value: asset.warrantyExpiryDate ?? "Not recorded" },
              {
                label: "Asset Scope",
                value: asset.assetScope ?? (isWorkstationAsset ? "Workstation Device" : "Other / Non-Workstation Device")
              },
              { label: "General Location", value: asset.generalLocation ?? "Not recorded" },
              { label: "Specific Location / Notes", value: asset.specificLocationNotes ?? "Not recorded" }
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.35rem] border border-[var(--border)] bg-white/80 px-4 py-4"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                  {item.label}
                </p>
                <div className="mt-3 text-sm font-semibold text-[var(--text)]">{item.value}</div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Current assignment / location">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {isWorkstationAsset ? (
              <>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Flow</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text)]">{asset.flow ?? "Not recorded"}</p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Workstation</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                    {asset.workstationCode ?? activeAssignment?.workstation.code ?? "Not recorded"}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Side</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text)]">{asset.side ?? "Not recorded"}</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Asset Scope</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text)]">
                    {asset.assetScope ?? "Other / Non-Workstation Device"}
                  </p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/80 px-4 py-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">General Location</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text)]">{asset.generalLocation ?? currentLocation}</p>
                </div>
                <div className="rounded-[1.35rem] border border-[var(--border)] bg-white/80 px-4 py-4 md:col-span-2 xl:col-span-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Specific Location / Notes</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text)]">{asset.specificLocationNotes ?? "Not recorded"}</p>
                </div>
              </>
            )}
          </div>
        </SectionCard>
      </div>

      <SectionCard title={assignmentSectionTitle}>
        {asset.workstationAssignments.length > 0 ? (
          <DataTable headers={["Workstation", "Assignment type", "Assigned date", "Removed", "Active"]}>
              {asset.workstationAssignments.map((assignment, index) => (
                <tr
                  key={assignment.id}
                  className={index % 2 === 0 ? "bg-white" : "bg-[#fcf8f1]"}
                >
                  <td className="px-4 py-4 text-sm font-medium text-[var(--nav)]">
                    {assignment.workstation.code}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <StatusBadge
                      value={assignment.assignmentType}
                      tone={assignment.assignmentType === "PRIMARY" ? "success" : undefined}
                    />
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted)]">
                    {new Date(assignment.assignedDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted)]">
                    {assignment.unassignedDate
                      ? new Date(assignment.unassignedDate).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <StatusBadge value={assignment.isActive ? "ACTIVE" : "REMOVED"} />
                  </td>
                </tr>
              ))}
          </DataTable>
        ) : (
          <EmptyState
            title={isWorkstationAsset ? "No assignment history yet" : "No location history yet"}
            message={
              isWorkstationAsset
                ? "No workstation assignment history has been recorded for this asset yet."
                : "No location history has been recorded for this asset yet. Update its assignment when it is moved."
            }
          />
        )}
      </SectionCard>

      <SectionCard title="Repair history">
        {repairs.length > 0 ? (
          <div className="space-y-3">
            {repairs.map((repair, index) => (
              <div
                key={repair.id}
                className="rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge value={repair.status} />
                      <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                        {formatDate(repair.reportedDate)}
                      </span>
                      <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-[var(--nav)]">
                        {repair.workstation.code}
                      </span>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-[var(--text)]">{repair.faultDescription}</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                          Replacement
                        </p>
                        <p className="mt-1 text-sm text-[var(--text)]">
                          {repair.replacementLog ? repair.replacementLog.replacementAsset.assetCode : "None"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                          Expected return
                        </p>
                        <p className="mt-1 text-sm text-[var(--text)]">
                          {repair.expectedReturnDate
                            ? formatDate(repair.expectedReturnDate)
                            : "Not set"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                          Actual return
                        </p>
                        <p className="mt-1 text-sm text-[var(--text)]">
                          {repair.actualReturnDate
                            ? formatDate(repair.actualReturnDate)
                            : "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 md:flex-col md:items-end">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--panel-strong)] text-[var(--accent)]">
                      <WrenchIcon />
                    </span>
                    <span className="text-xs text-[var(--muted)]">Repair {index + 1}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No repair history"
            message="No repair records have been logged yet. Use Log Repair to create the first repair entry."
          />
        )}
      </SectionCard>

      <SectionCard title="Related alerts">
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
          </div>
        ) : (
          <EmptyState
            title="No active alerts"
            message="There are currently no alerts linked to this asset record."
          />
        )}
      </SectionCard>
    </div>
  );
}
