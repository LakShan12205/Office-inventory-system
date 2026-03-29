import Link from "next/link";
import { AlertCard } from "@/components/ui/alert-card";
import { DataTable } from "@/components/ui/data-table";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDashboard } from "@/lib/api";
import { DashboardData } from "@/lib/types";

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
      <path d="M9 19.5h6" />
      <path d="M12 15.5v4" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M4 7.5 12 4l8 3.5L12 11 4 7.5Z" />
      <path d="M4 12.5 12 16l8-3.5" />
      <path d="M4 16.5 12 20l8-3.5" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M14 6a4 4 0 0 0 4.7 4.7l-8.4 8.4a2 2 0 1 1-2.8-2.8l8.4-8.4A4 4 0 0 0 14 6Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M7 7h11" />
      <path d="m15 4 3 3-3 3" />
      <path d="M17 17H6" />
      <path d="m9 14-3 3 3 3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function HeroIllustration() {
  return (
    <div className="relative h-[20rem] overflow-hidden rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_38%),linear-gradient(155deg,rgba(255,255,255,0.14),rgba(255,255,255,0.03))] p-5">
      <div className="dashboard-grid-glow absolute inset-0 opacity-30" />
      <div className="dashboard-dots absolute inset-y-0 right-0 w-1/2 opacity-30" />
      <div className="absolute -left-8 top-8 h-28 w-28 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute left-5 top-7 h-28 w-32 rounded-[1.8rem] border border-white/20 bg-white/10 backdrop-blur-md" />
      <div className="absolute left-16 top-20 h-20 w-28 rounded-[1.5rem] border border-white/20 bg-[#f7d9b0]/20 backdrop-blur-md" />
      <div className="absolute right-7 top-8 h-36 w-40 rounded-[2rem] border border-white/20 bg-[var(--accent)]/14 backdrop-blur-md" />
      <div className="absolute right-16 top-16 h-24 w-24 rounded-[1.8rem] border border-white/20 bg-white/12 backdrop-blur-md" />
      <div className="absolute right-12 top-12 h-12 w-20 rounded-2xl border border-white/15 bg-white/10" />
      <div className="absolute bottom-8 left-10 right-10 flex items-end gap-4">
        <div className="h-16 flex-1 rounded-t-[1.6rem] bg-white/15 shadow-[0_0_30px_rgba(255,255,255,0.08)]" />
        <div className="h-24 flex-1 rounded-t-[1.6rem] bg-white/20 shadow-[0_0_30px_rgba(255,255,255,0.08)]" />
        <div className="h-20 flex-1 rounded-t-[1.6rem] bg-[#f6d3aa]/25 shadow-[0_0_30px_rgba(246,211,170,0.12)]" />
        <div className="h-28 flex-1 rounded-t-[1.6rem] bg-white/25 shadow-[0_0_30px_rgba(255,255,255,0.10)]" />
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <rect x="6" y="5" width="12" height="15" rx="2" />
      <path d="M9 5.5h6" />
      <path d="M9 10h6" />
      <path d="M9 14h4" />
    </svg>
  );
}

function SparkSwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M7 7h10" />
      <path d="m14 4 3 3-3 3" />
      <path d="M17 17H7" />
      <path d="m10 14-3 3 3 3" />
      <path d="M5 5h.01" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M6.5 16.5h11l-1.5-2.2V10a4 4 0 1 0-8 0v4.3l-1.5 2.2Z" />
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </svg>
  );
}

export default async function DashboardPage() {
  const data = (await getDashboard()) as DashboardData;
  const openAlerts = data.latestAlerts.filter((alert) => alert.status !== "RESOLVED");
  const highAlerts = data.latestAlerts.filter((alert) => alert.priority === "HIGH").length;
  const recentRepairs = Array.from(
    new Map(
      data.recentRepairs.map((repair) => [
        `${repair.asset.id}-${repair.status}-${repair.workstation.id}-${repair.expectedReturnDate ?? "none"}`,
        repair
      ])
    ).values()
  ).slice(0, 3);
  const latestAlerts = data.latestAlerts.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2.2rem] bg-[linear-gradient(135deg,#142946_0%,#1c3d63_52%,#2f5876_100%)] px-6 py-7 text-white shadow-[0_28px_80px_rgba(24,49,83,0.26)] lg:px-8 lg:py-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,208,165,0.20),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />
        <div className="absolute -left-14 top-6 h-32 w-32 rounded-full bg-[#f7d0a5]/18 blur-3xl" />
        <div className="absolute right-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-6 xl:grid-cols-[1.15fr_0.85fr] xl:items-center">
          <div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white lg:text-[2.8rem]">
              Office Inventory Command Center
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-200 lg:text-base">
              Monitor assets, repairs, replacements, and alerts in one view.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/assets/new" className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[#f9f2e7]">
                Add new asset
              </Link>
              <Link href="/repairs/new" className="rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15">
                Log repair issue
              </Link>
            </div>

            <div className="mt-6 rounded-[1.5rem] border border-white/12 bg-white/10 px-5 py-4 backdrop-blur">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">Today&apos;s overview</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-100">
                <li>{data.stats.machinesInRepair} machines in repair</li>
                <li>{data.stats.activeTemporaryReplacements} active replacements</li>
                <li>{openAlerts.length} open alerts, {highAlerts} high priority</li>
              </ul>
            </div>
          </div>

          <HeroIllustration />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total workstations"
          value={data.stats.totalWorkstations}
          icon={<MonitorIcon />}
          badge="Live"
          tone="navy"
        />
        <StatCard
          label="Total assets"
          value={data.stats.totalAssets}
          icon={<StackIcon />}
          badge="Inventory"
          tone="amber"
        />
        <StatCard
          label="Machines in repair"
          value={data.stats.machinesInRepair}
          icon={<WrenchIcon />}
          badge="Repair"
          tone="rose"
        />
        <StatCard
          label="Active replacements"
          value={data.stats.activeTemporaryReplacements}
          icon={<SwapIcon />}
          badge="Active"
          tone="navy"
        />
        <StatCard
          label="Overdue repairs"
          value={data.stats.overdueRepairs}
          icon={<AlertIcon />}
          badge="Overdue"
          tone="emerald"
        />
      </div>

      <SectionCard title="Quick actions">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { href: "/assets/new", label: "Add Asset", icon: <PlusIcon /> },
            { href: "/repairs/new", label: "Log Repair", icon: <ClipboardIcon /> },
            { href: "/replacements", label: "Assign Replacement", icon: <SparkSwapIcon /> },
            { href: "/alerts", label: "View Alerts", icon: <BellIcon /> }
          ].map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group rounded-[1.5rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d7c2a6] hover:shadow-[0_20px_50px_rgba(24,49,83,0.10)]"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(24,49,83,0.96),rgba(201,111,45,0.86))] text-white shadow-[0_16px_36px_rgba(24,49,83,0.20)] transition duration-300 group-hover:scale-105">
                  {action.icon}
                </span>
                <span className="rounded-full bg-[var(--panel-strong)] px-2.5 py-1 text-xs text-[var(--muted)] transition group-hover:bg-[#f2e6d4]">
                  Open
                </span>
              </div>
              <p className="mt-4 text-sm font-semibold text-[var(--nav)]">{action.label}</p>
            </Link>
          ))}
        </div>
      </SectionCard>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard
          title="Recent repair activity"
          action={
            <Link href="/repairs" className="text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--nav)]">
              View all repairs
            </Link>
          }
        >
          <DataTable
            headers={["Machine", "Workstation", "Fault", "Status", "Expected Return", "Replacement"]}
          >
            {recentRepairs.map((repair) => (
              <tr key={repair.id}>
                <td className="px-4 py-4 text-sm font-medium">
                  <Link href={`/assets/${repair.asset.id}`} className="text-[var(--nav)] hover:text-[var(--accent)]">
                    {repair.asset.assetCode}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--muted)]">
                    {repair.asset.brand} {repair.asset.model}
                  </div>
                </td>
                <td className="px-4 py-4 text-sm">
                  <span className="rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-[var(--nav)]">
                    {repair.workstation.code}
                  </span>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--muted)]">
                  <span className="block max-w-xs leading-6">{repair.faultDescription}</span>
                </td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge value={repair.status} />
                </td>
                <td className="px-4 py-4 text-sm">
                  {repair.expectedReturnDate
                    ? new Date(repair.expectedReturnDate).toLocaleDateString()
                    : "Not set"}
                </td>
                <td className="px-4 py-4 text-sm">
                  {repair.replacementLog ? (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                      {repair.replacementLog.replacementAsset.assetCode}
                    </span>
                  ) : (
                    "None"
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        </SectionCard>

        <SectionCard
          title="Latest alerts"
          action={
            <Link href="/alerts" className="text-sm font-semibold text-[var(--accent)] transition hover:text-[var(--nav)]">
              View all alerts
            </Link>
          }
        >
          <div className="space-y-3">
            {latestAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
