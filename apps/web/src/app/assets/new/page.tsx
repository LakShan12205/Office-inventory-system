import { AssetForm } from "@/components/forms/asset-form";
import { PageHeader } from "@/components/ui/page-header";
import { getAssetTypes } from "@/lib/api";
import { AssetType } from "@/lib/types";

export default async function NewAssetPage() {
  const assetTypes = (await getAssetTypes()) as AssetType[];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add Inventory"
        description="Create a new inventory record for office assets."
      />
      <AssetForm assetTypes={assetTypes} />
    </div>
  );
}
