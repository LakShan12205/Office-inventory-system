import { ReplacementFormView, ReplacementInitialContext } from "@/components/replacements/replacement-form-view";
import { PageHeader } from "@/components/ui/page-header";
import { getAssets, getReplacements } from "@/lib/api";
import { AssetRecord, ReplacementRecord } from "@/lib/types";

function normalizeAssets(input: unknown): AssetRecord[] {
  if (Array.isArray(input)) return input as AssetRecord[];
  if (input && typeof input === "object") {
    const value = input as { items?: unknown };
    if (Array.isArray(value.items)) return value.items as AssetRecord[];
  }
  return [];
}

export default async function NewReplacementPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const [replacements, assets] = await Promise.all([
    getReplacements() as Promise<ReplacementRecord[]>,
    getAssets("?pageSize=500")
  ]);

  const toSingle = (value: string | string[] | undefined) =>
    typeof value === "string" && value.trim() ? value : undefined;

  const flowCode = toSingle(params?.flowCode);
  const initialReason = toSingle(params?.reason);
  const initialContext: ReplacementInitialContext = {
    originalAssetId: toSingle(params?.assetId),
    originalAssetCode: toSingle(params?.assetCode),
    workstationCode: toSingle(params?.workstationCode),
    flowCode: flowCode === "Flow-01" || flowCode === "Flow-02" ? flowCode : undefined,
    reason:
      initialReason === "Due to ongoing repair" ||
      initialReason === "Not working" ||
      initialReason === "Other"
        ? initialReason
        : undefined
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Replacement form"
        description="Review the selected damaged device, choose an eligible replacement asset from inventory, and save the replacement record."
      />
      <ReplacementFormView
        replacements={replacements}
        assets={normalizeAssets(assets)}
        initialContext={initialContext}
      />
    </div>
  );
}
