import { RepairReportForm } from "@/components/forms/repair-report-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAssets, getWorkstations } from "@/lib/api";
import { AssetRecord, WorkstationListItem } from "@/lib/types";

export default async function NewRepairPage() {
  const [workstations, assets] = await Promise.all([
    getWorkstations(),
    getAssets("?type=Machine")
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Report faulty machine"
        description="Create a full repair record, capture who handled it, where it went, and optionally assign a temporary replacement machine."
      />
      <RepairReportForm
        workstations={workstations as WorkstationListItem[]}
        machineAssets={assets as AssetRecord[]}
      />
    </div>
  );
}
