import { AssetForm } from "@/components/forms/asset-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAsset, getAssetTypes } from "@/lib/api";
import { AssetRecord, AssetType } from "@/lib/types";

export default async function EditAssetPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [assetTypes, asset] = (await Promise.all([
    getAssetTypes(),
    getAsset(id)
  ])) as [AssetType[], AssetRecord];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Edit Inventory"
        description="Update this inventory record and its current assignment details."
      />
      <AssetForm assetTypes={assetTypes} initialAsset={asset} />
    </div>
  );
}
