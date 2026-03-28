import { AlertCard } from "@/components/ui/alert-card";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAsset } from "@/lib/api";
import { AssetRecord } from "@/lib/types";

export default async function AssetDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const asset = (await getAsset(id)) as AssetRecord;

  return (
    <div className="space-y-5">
      <PageHeader
        title={asset.assetCode}
        description={`${asset.assetType.name} asset profile with assignment history, repair history, and related alerts.`}
      />

      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <SectionCard title="Asset profile">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Type</p>
              <p className="mt-2 text-sm font-medium">{asset.assetType.name}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Status</p>
              <div className="mt-2">
                <StatusBadge value={asset.status} />
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Brand / Model</p>
              <p className="mt-2 text-sm font-medium">
                {asset.brand} {asset.model}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Serial number</p>
              <p className="mt-2 text-sm font-medium">{asset.serialNumber}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Specification</p>
              <p className="mt-2 text-sm">{asset.specification || "Not recorded"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Purchase date</p>
              <p className="mt-2 text-sm">
                {asset.purchaseDate ? new Date(asset.purchaseDate).toLocaleDateString() : "Not recorded"}
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Assignment history">
          <DataTable headers={["Workstation", "Assignment type", "Assigned date", "Removed", "Active"]}>
            {asset.workstationAssignments.map((assignment) => (
              <tr key={assignment.id}>
                <td className="px-4 py-4 text-sm">{assignment.workstation.code}</td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge value={assignment.assignmentType} />
                </td>
                <td className="px-4 py-4 text-sm">
                  {new Date(assignment.assignedDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-sm">
                  {assignment.unassignedDate
                    ? new Date(assignment.unassignedDate).toLocaleDateString()
                    : "-"}
                </td>
                <td className="px-4 py-4 text-sm">{assignment.isActive ? "Yes" : "No"}</td>
              </tr>
            ))}
          </DataTable>
        </SectionCard>
      </div>

      <SectionCard title="Repair history">
        <DataTable headers={["Reported", "Workstation", "Fault", "Status", "Replacement", "Returned"]}>
          {asset.repairs?.map((repair) => (
            <tr key={repair.id}>
              <td className="px-4 py-4 text-sm">{new Date(repair.reportedDate).toLocaleDateString()}</td>
              <td className="px-4 py-4 text-sm">{repair.workstation.code}</td>
              <td className="px-4 py-4 text-sm text-[var(--muted)]">{repair.faultDescription}</td>
              <td className="px-4 py-4 text-sm">
                <StatusBadge value={repair.status} />
              </td>
              <td className="px-4 py-4 text-sm">
                {repair.replacementLog ? repair.replacementLog.replacementAsset.assetCode : "None"}
              </td>
              <td className="px-4 py-4 text-sm">
                {repair.actualReturnDate ? new Date(repair.actualReturnDate).toLocaleDateString() : "-"}
              </td>
            </tr>
          ))}
        </DataTable>
      </SectionCard>

      <SectionCard title="Related alerts">
        <div className="space-y-3">
          {asset.alerts?.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      </SectionCard>
    </div>
  );
}
