import Link from "next/link";
import { AlertCard } from "@/components/ui/alert-card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getWorkstation } from "@/lib/api";
import { WorkstationDetail } from "@/lib/types";

export default async function WorkstationDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workstation = (await getWorkstation(id)) as WorkstationDetail;

  return (
    <div className="space-y-5">
      <PageHeader
        title={`${workstation.code} - ${workstation.name}`}
        description={`Located at ${workstation.location}. Review currently assigned assets, workstation-specific repairs, and active alerts.`}
        action={
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/workstations/${workstation.id}/assign`}
              className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white"
            >
              Assign asset
            </Link>
            <Link
              href="/repairs/new"
              className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Report faulty machine
            </Link>
          </div>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <SectionCard title="Assigned assets" description="Temporary replacement assets are clearly marked in the assignment column.">
          <DataTable headers={["Asset code", "Asset type", "Brand / Model", "Status", "Assignment", "Assigned date"]}>
            {workstation.assets.map((assignment) => (
              <tr key={assignment.id}>
                <td className="px-4 py-4 text-sm font-medium">
                  <Link href={`/assets/${assignment.asset.id}`} className="text-[var(--nav)] hover:text-[var(--accent)]">
                    {assignment.asset.assetCode}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm">{assignment.asset.assetType.name}</td>
                <td className="px-4 py-4 text-sm text-[var(--muted)]">
                  {assignment.asset.brand} {assignment.asset.model}
                </td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge value={assignment.asset.status} />
                </td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge
                    value={assignment.assignmentType}
                    tone={assignment.assignmentType === "TEMPORARY_REPLACEMENT" ? "warning" : undefined}
                  />
                </td>
                <td className="px-4 py-4 text-sm">
                  {new Date(assignment.assignedDate).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </DataTable>
        </SectionCard>

        <SectionCard title="Current alerts" description="Alerts generated for this workstation only.">
          <div className="space-y-3">
            {workstation.alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Repair history" description="This includes repeated repairs and replacement activity linked to the workstation.">
        <DataTable headers={["Machine", "Reported", "Fault", "Status", "Sent to", "Replacement"]}>
          {workstation.repairs.map((repair) => (
            <tr key={repair.id}>
              <td className="px-4 py-4 text-sm font-medium">{repair.asset.assetCode}</td>
              <td className="px-4 py-4 text-sm">{new Date(repair.reportedDate).toLocaleDateString()}</td>
              <td className="px-4 py-4 text-sm text-[var(--muted)]">{repair.faultDescription}</td>
              <td className="px-4 py-4 text-sm">
                <StatusBadge value={repair.status} />
              </td>
              <td className="px-4 py-4 text-sm">{repair.sentTo || "On-site"}</td>
              <td className="px-4 py-4 text-sm">
                {repair.replacementLog ? repair.replacementLog.replacementAsset.assetCode : "None"}
              </td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>
    </div>
  );
}
