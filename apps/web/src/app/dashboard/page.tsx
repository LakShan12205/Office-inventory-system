export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { DashboardFooter } from "@/components/dashboard-footer";
import { StatCard } from "@/components/ui/stat-card";
import { ApiError, getDashboard } from "@/lib/api";
import { DashboardData } from "@/lib/types";

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.9]">
      <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
      <path d="M9 19.5h6" />
      <path d="M12 15.5v4" />
    </svg>
  );
}

function PackageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.9]">
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" />
      <path d="M12 12v8" />
      <path d="M4.5 8.8 12 13l7.5-4.2" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.9]">
      <path d="M14 6a4 4 0 0 0 4.7 4.7l-8.4 8.4a2 2 0 1 1-2.8-2.8l8.4-8.4A4 4 0 0 0 14 6Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

function RefreshCcwIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.9]">
      <path d="M3 12a9 9 0 0 1 15.4-6.4" />
      <path d="M18 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.4 6.4" />
      <path d="M6 21v-5h5" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.9]">
      <path d="M15 17H9" />
      <path d="M18 17H6l1.4-1.6c.8-.9 1.2-2.1 1.2-3.3V10a3.4 3.4 0 1 1 6.8 0v2.1c0 1.2.4 2.4 1.2 3.3L18 17Z" />
      <path d="M10.5 20a1.7 1.7 0 0 0 3 0" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

const quickActions = [
  {
    label: "Add Asset",
    description: "Register new inventory assets into the system.",
    href: "/assets/new"
  },
  {
    label: "Log Repair",
    description: "Record a machine issue and start the repair flow.",
    href: "/repairs/new"
  },
  {
    label: "Assign Replacement",
    description: "Assign a temporary or permanent replacement asset.",
    href: "/replacements/new"
  },
  {
    label: "View Alerts",
    description: "Review follow-up alerts and workstation notifications.",
    href: "/alerts"
  }
];

export default async function DashboardPage() {
  let data: DashboardData = {
    stats: {
      totalWorkstations: 0,
      totalAssets: 0,
      newAssets: 0,
      legacyAssets: 0,
      machinesInRepair: 0,
      activeTemporaryReplacements: 0,
      incompleteAssets: 0,
      needsVerificationAssets: 0,
      assetsMissingSerial: 0,
      assetsMissingInvoice: 0,
      averageProfileCompletion: 0,
      returnedReplacements: 0,
      overdueRepairs: 0,
      followUpAlerts: 0
    },
    latestAlerts: [],
    recentRepairs: []
  };

  try {
    data = (await getDashboard()) as DashboardData;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }

    console.log("Dashboard fetch failed, using fallback data");
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Workstations"
          value={data.stats.totalWorkstations}
          icon={<MonitorIcon />}
          compact
        />
        <StatCard
          label="Total Assets"
          value={data.stats.totalAssets}
          icon={<PackageIcon />}
          tone="amber"
          compact
        />
        <StatCard
          label="New Assets"
          value={data.stats.newAssets}
          icon={<PackageIcon />}
          tone="navy"
          compact
        />
        <StatCard
          label="Legacy Assets"
          value={data.stats.legacyAssets}
          icon={<PackageIcon />}
          tone="amber"
          compact
        />
        <StatCard
          label="Machines in Repair"
          value={data.stats.machinesInRepair}
          icon={<WrenchIcon />}
          tone="rose"
          compact
        />
        <StatCard
          label="Active Replacements"
          value={data.stats.activeTemporaryReplacements}
          icon={<RefreshCcwIcon />}
          compact
        />
        <StatCard
          label="Incomplete Assets"
          value={data.stats.incompleteAssets}
          icon={<PackageIcon />}
          tone="rose"
          compact
        />
        <StatCard
          label="Needs Verification"
          value={data.stats.needsVerificationAssets}
          icon={<BellIcon />}
          tone="amber"
          compact
        />
        <StatCard
          label="Missing Serial"
          value={data.stats.assetsMissingSerial}
          icon={<MonitorIcon />}
          tone="rose"
          compact
        />
        <StatCard
          label="Missing Invoice"
          value={data.stats.assetsMissingInvoice}
          icon={<PackageIcon />}
          tone="amber"
          compact
        />
        <StatCard
          label="Avg Completion"
          value={`${data.stats.averageProfileCompletion}%`}
          icon={<RefreshCcwIcon />}
          tone="emerald"
          compact
        />
        <StatCard
          label="Follow-up Alerts"
          value={data.stats.followUpAlerts}
          icon={<BellIcon />}
          tone="emerald"
          compact
        />
      </div>

      <section className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.95))] p-4 shadow-[0_16px_45px_rgba(24,49,83,0.07)]">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
              Quick Actions
            </p>
            <h2 className="mt-1.5 text-lg font-semibold text-[var(--nav)]">
              Jump into the most common dashboard tasks
            </h2>
          </div>
          <p className="max-w-md text-sm leading-5 text-[var(--muted)]">
            Use these shortcuts to keep asset registration, repair tracking, replacements, and alerts moving quickly.
          </p>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className="group flex min-h-[116px] flex-col justify-between rounded-[1.15rem] border border-[var(--border)] bg-white/85 p-4 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#d7c2a6] hover:shadow-[0_16px_40px_rgba(24,49,83,0.09)]"
            >
              <div>
                <p className="text-base font-semibold text-[var(--nav)]">{action.label}</p>
                <p className="mt-1.5 text-sm leading-5 text-[var(--muted)]">
                  {action.description}
                </p>
              </div>

              <span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--accent)] transition group-hover:gap-3">
                Open
                <ArrowRightIcon />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <DashboardFooter />
    </div>
  );
}
