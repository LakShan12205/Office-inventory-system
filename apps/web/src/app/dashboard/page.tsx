export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { DashboardFooter } from "@/components/dashboard-footer";
import { StatCard } from "@/components/ui/stat-card";
import { ApiError, getDashboard } from "@/lib/api";
import { DashboardData } from "@/lib/types";

export default async function DashboardPage() {
  let data: DashboardData = {
    stats: {
      totalWorkstations: 0,
      totalAssets: 0,
      machinesInRepair: 0,
      activeTemporaryReplacements: 0,
      returnedReplacements: 0,
      overdueRepairs: 0,
      followUpAlerts: 0
    },
    latestAlerts: [],       // ✅ REQUIRED
    recentRepairs: []       // ✅ REQUIRED
  };

  try {
    data = (await getDashboard()) as DashboardData;
  } catch (error) {
    // 🔐 Not logged → go login
    if (error instanceof ApiError) {
      if (error.message.toLowerCase().includes("authentication")) {
        redirect("/login");
      }
    }

    // ❗ Prevent crash
    console.log("Dashboard fetch failed, using fallback data");
  }

  return (
    <div className="space-y-7">
      <h1 className="text-2xl font-semibold">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total Workstations" value={data.stats.totalWorkstations} />
        <StatCard label="Total Assets" value={data.stats.totalAssets} />
        <StatCard label="Machines in Repair" value={data.stats.machinesInRepair} />
        <StatCard
          label="Active Replacements"
          value={data.stats.activeTemporaryReplacements}
        />
        <StatCard label="Follow-up Alerts" value={data.stats.followUpAlerts} />
      </div>

      <DashboardFooter />
    </div>
  );
}