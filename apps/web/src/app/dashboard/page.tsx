import Link from "next/link";
import { AlertCard } from "@/components/ui/alert-card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDashboard } from "@/lib/api";
import { DashboardData } from "@/lib/types";

export default async function DashboardPage() {
  const data = (await getDashboard()) as DashboardData;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Dashboard"
        description="Get a quick snapshot of workstation coverage, repairs in flight, temporary machine usage, and alerts that need follow-up."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total workstations" value={data.stats.totalWorkstations} hint="Office workstations currently tracked in the system." />
        <StatCard label="Total assets" value={data.stats.totalAssets} hint="All individual assets recorded across the office." />
        <StatCard label="Machines in repair" value={data.stats.machinesInRepair} hint="Machines currently reported, sent, or still in progress." />
        <StatCard label="Active replacements" value={data.stats.activeTemporaryReplacements} hint="Temporary replacement machines currently active at workstations." />
        <StatCard label="Overdue repairs" value={data.stats.overdueRepairs} hint="Repairs past expected return date with no actual return logged." />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard
          title="Recent repair activity"
          description="Track what was reported most recently and whether the workstation is still waiting on a return."
        >
          <DataTable
            headers={["Machine", "Workstation", "Fault", "Status", "Expected Return", "Replacement"]}
          >
            {data.recentRepairs.map((repair) => (
              <tr key={repair.id}>
                <td className="px-4 py-4 text-sm font-medium">
                  <Link href={`/assets/${repair.asset.id}`} className="text-[var(--nav)] hover:text-[var(--accent)]">
                    {repair.asset.assetCode}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm">{repair.workstation.code}</td>
                <td className="px-4 py-4 text-sm text-[var(--muted)]">{repair.faultDescription}</td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge value={repair.status} />
                </td>
                <td className="px-4 py-4 text-sm">
                  {repair.expectedReturnDate
                    ? new Date(repair.expectedReturnDate).toLocaleDateString()
                    : "Not set"}
                </td>
                <td className="px-4 py-4 text-sm">
                  {repair.replacementLog ? repair.replacementLog.replacementAsset.assetCode : "None"}
                </td>
              </tr>
            ))}
          </DataTable>
        </SectionCard>

        <SectionCard
          title="Latest alerts"
          description="High-signal reminders generated from repair deadlines, returned machines, and replacement tracking."
        >
          <div className="space-y-3">
            {data.latestAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
