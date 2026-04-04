import { RepairReportForm } from "@/components/forms/repair-report-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAssets, getWorkstations } from "@/lib/api";
import { AssetRecord, WorkstationListItem } from "@/lib/types";

function normalizeAssets(input: unknown): AssetRecord[] {
  if (Array.isArray(input)) {
    return input as AssetRecord[];
  }

  if (input && typeof input === "object") {
    const value = input as { items?: unknown; data?: unknown; assets?: unknown };

    if (Array.isArray(value.items)) {
      return value.items as AssetRecord[];
    }

    if (Array.isArray(value.data)) {
      return value.data as AssetRecord[];
    }

    if (Array.isArray(value.assets)) {
      return value.assets as AssetRecord[];
    }
  }

  return [];
}

export default async function NewRepairPage() {
  const [workstations, assets] = await Promise.all([
    getWorkstations(),
    getAssets("?pageSize=500")
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Repair Details"
        description="Choose the repair source first, then select an existing inventory asset and record its repair details."
      />
      <RepairReportForm
        workstations={workstations as WorkstationListItem[]}
        assets={normalizeAssets(assets)}
      />
    </div>
  );
}
