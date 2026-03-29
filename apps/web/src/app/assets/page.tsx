import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAssets } from "@/lib/api";
import { appendQueryParam } from "@/lib/query";

type AssetPageRecord = {
  id: string;
  assetCode?: string;
  brand?: string;
  model?: string;
  serialNumber?: string | null;
  status?: string;
  currentLocation?: string | null;
  assetType?: {
    id?: string;
    name?: string;
  } | null;
  workstation?: {
    id?: string;
    code?: string;
  } | null;
  workstationAssignments?: Array<{
    workstation?: {
      id?: string;
      code?: string;
    } | null;
  }>;
};

function normalizeAssets(input: any): AssetPageRecord[] {
  if (Array.isArray(input)) return input;

  if (input?.data && Array.isArray(input.data)) {
    return input.data;
  }

  if (input?.data?.assets) {
    return input.data.assets;
  }

  if (input?.assets) {
    return input.assets;
  }

  if (input?.items) {
    return input.items;
  }

  return [];
}

export default async function AssetsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  appendQueryParam(query, "search", params?.search);
  appendQueryParam(query, "type", params?.type);
  appendQueryParam(query, "status", params?.status);

  let assets: AssetPageRecord[] = [];

  try {
    const result = await getAssets(
      query.toString() ? `?${query.toString()}` : ""
    );

    assets = normalizeAssets(result);
  } catch (error) {
    console.error("Assets error:", error);
    return <div>Failed to load assets</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assets"
        description="Search and manage all assets."
        action={
          <Link
            href="/assets/new"
            className="bg-black text-white px-4 py-2 rounded"
          >
            Add Asset
          </Link>
        }
      />

      {/* FILTER */}
      <div className="border p-5 rounded">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            name="search"
            defaultValue={typeof params?.search === "string" ? params.search : ""}
            placeholder="Search asset"
            className="border px-4 py-2 rounded"
          />
          <input
            name="type"
            defaultValue={typeof params?.type === "string" ? params.type : ""}
            placeholder="Type"
            className="border px-4 py-2 rounded"
          />
          <select
            name="status"
            defaultValue={typeof params?.status === "string" ? params.status : ""}
            className="border px-4 py-2 rounded"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="IN_STORE">In Store</option>
            <option value="DAMAGED">Damaged</option>
          </select>
          <button className="bg-black text-white px-4 py-2 rounded">
            Filter
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="border p-5 rounded">
        <DataTable
          headers={[
            "Asset Code",
            "Type",
            "Brand / Model",
            "Serial",
            "Status",
            "Location"
          ]}
        >
          {assets.map((asset) => {
            const workstationCode =
              asset.workstationAssignments?.[0]?.workstation?.code ??
              asset.workstation?.code ??
              asset.currentLocation ??
              "Store";

            return (
              <tr key={asset.id}>
                <td>
                  <Link href={`/assets/${asset.id}`}>
                    {asset.assetCode ?? "Unknown"}
                  </Link>
                </td>
                <td>{asset.assetType?.name ?? "N/A"}</td>
                <td>
                  {(asset.brand ?? "-") + " " + (asset.model ?? "")}
                </td>
                <td>{asset.serialNumber ?? "-"}</td>
                <td>
                  <StatusBadge value={asset.status ?? "UNKNOWN"} />
                </td>
                <td>{workstationCode}</td>
              </tr>
            );
          })}
        </DataTable>
      </div>
    </div>
  );
}