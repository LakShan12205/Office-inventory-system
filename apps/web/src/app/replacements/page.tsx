import { ReplacementRecordsList } from "@/components/replacements/replacement-records-list";
import { ReplacementsWorkspace } from "@/components/replacements/replacements-workspace";
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

function normalizeReplacements(input: unknown): ReplacementRecord[] {
  return Array.isArray(input) ? (input as ReplacementRecord[]) : [];
}

export default async function ReplacementsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const statusFilter =
    typeof params?.status === "string" && params.status.trim() ? params.status : undefined;
  const searchQuery =
    typeof params?.q === "string" && params.q.trim() ? params.q : undefined;

  if (statusFilter) {
    const replacements = await getReplacements();

    return (
      <div className="space-y-5">
        <PageHeader
          title="Replacement operations"
          description="Browse and filter replacement activity in a dedicated operational list view."
        />
        <ReplacementRecordsList
          records={normalizeReplacements(replacements)}
          statusFilter={statusFilter}
          searchQuery={searchQuery}
        />
      </div>
    );
  }

  const [assets, replacements] = await Promise.all([
    getAssets("?pageSize=500"),
    getReplacements()
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Replacement management"
        description="Select an existing damaged device, then choose an eligible replacement asset from inventory and complete the replacement record."
      />
      <ReplacementsWorkspace
        assets={normalizeAssets(assets)}
        replacements={normalizeReplacements(replacements)}
      />
    </div>
  );
}
