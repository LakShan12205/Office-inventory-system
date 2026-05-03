export const dynamic = "force-dynamic";

import { AssetForm } from "@/components/forms/asset-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAssets, getAssetTypes, getBackendWorkstations } from "@/lib/api";
import { AssetRecord, AssetType, WorkstationListItem } from "@/lib/types";

function normalizeAssets(input: unknown): AssetRecord[] {
  if (Array.isArray(input)) return input as AssetRecord[];
  if (input && typeof input === "object" && Array.isArray((input as { items?: unknown[] }).items)) {
    return (input as { items: AssetRecord[] }).items;
  }
  return [];
}

export default async function NewAssetPage() {
  const [assetTypes, assets, workstations] = (await Promise.all([
    getAssetTypes(),
    getAssets("?pageSize=500"),
    getBackendWorkstations()
  ])) as [AssetType[], AssetRecord[] | { items: AssetRecord[] }, WorkstationListItem[]];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add Inventory"
        description="Create a new inventory record for office assets."
      />
      <AssetForm
        assetTypes={assetTypes}
        assets={normalizeAssets(assets)}
        workstations={workstations}
      />
    </div>
  );
}
