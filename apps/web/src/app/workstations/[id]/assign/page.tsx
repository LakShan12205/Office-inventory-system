import { AssignAssetForm } from "@/components/forms/assign-asset-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAssets, getWorkstation } from "@/lib/api";
import { AssetRecord, WorkstationDetail } from "@/lib/types";

export default async function AssignAssetPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [workstation, assets] = await Promise.all([
    getWorkstation(id),
    getAssets()
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assign asset"
        description="Assign an existing unassigned asset to this workstation and keep the assignment history recorded."
      />
      <AssignAssetForm
        workstation={workstation as WorkstationDetail}
        assets={assets as AssetRecord[]}
      />
    </div>
  );
}
