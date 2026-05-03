export const dynamic = "force-dynamic";

import { AssetForm } from "@/components/forms/asset-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAsset, getAssets, getAssetTypes, getBackendWorkstations } from "@/lib/api";
import { AssetRecord, AssetType, WorkstationListItem } from "@/lib/types";

function normalizeAssets(input: unknown): AssetRecord[] {
  if (Array.isArray(input)) return input as AssetRecord[];
  if (input && typeof input === "object" && Array.isArray((input as { items?: unknown[] }).items)) {
    return (input as { items: AssetRecord[] }).items;
  }
  return [];
}

export default async function EditAssetPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [assetTypes, asset, assets, workstations] = (await Promise.all([
    getAssetTypes(),
    getAsset(id),
    getAssets("?pageSize=500"),
    getBackendWorkstations()
  ])) as [AssetType[], AssetRecord, AssetRecord[] | { items: AssetRecord[] }, WorkstationListItem[]];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Edit Inventory"
        description="Update this inventory record and its current assignment details."
      />
      <AssetForm
        assetTypes={assetTypes}
        assets={normalizeAssets(assets)}
        workstations={workstations}
        initialAsset={asset}
      />
    </div>
  );
}
