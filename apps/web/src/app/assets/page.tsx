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

function normalizeAssets(input: unknown): AssetPageRecord[] {
  if (Array.isArray(input)) {
    return input as AssetPageRecord[];
  }

  if (input && typeof input === "object") {
    const value = input as {
      items?: unknown;
      data?: unknown;
      assets?: unknown;
    };

    if (Array.isArray(value.items)) {
      return value.items as AssetPageRecord[];
    }

    if (Array.isArray(value.data)) {
      return value.data as AssetPageRecord[];
    }

    if (Array.isArray(value.assets)) {
      return value.assets as AssetPageRecord[];
    }
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
    const result = await getAssets(query.toString() ? `?${query.toString()}` : "");
    assets = normalizeAssets(result);
  } catch (error) {
    console.error("Failed to load assets page:", error);

    return (
      <div className="space-y-5">
        <PageHeader
          title="Assets"
          description="Search by workstation code, asset code, or serial number, and filter by asset type or status."
          action={
            <Link
              href="/assets/new"
              className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              Add asset
            </Link>
          }
        />
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
          <p className="text-sm text-red-600">Failed to load assets.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assets"
        description="Search by workstation code, asset code, or serial number, and filter by asset type or status."
        action={
          <Link
            href="/assets/new"
            className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
          >
            Add asset
          </Link>
        }
      />

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            name="search"
            defaultValue={typeof params?.search === "string" ? params.search : ""}
            placeholder="Asset code, serial number, or workstation"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          <input
            name="type"
            defaultValue={typeof params?.type === "string" ? params.type : ""}
            placeholder="Asset type"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          <select
            name="status"
            defaultValue={typeof params?.status === "string" ? params.status : ""}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="IN_STORE">In Store</option>
            <option value="TEMPORARY_REPLACEMENT">Temporary Replacement</option>
            <option value="DAMAGED">Damaged</option>
            <option value="RETIRED">Retired</option>
          </select>
          <button className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white">
            Apply filters
          </button>
        </form>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <DataTable
          headers={["Asset code", "Type", "Brand / Model", "Serial number", "Status", "Current location"]}
        >
          {assets.map((asset) => {
            const workstationCode =
              asset.workstationAssignments?.[0]?.workstation?.code ??
              asset.workstation?.code ??
              asset.currentLocation ??
              "Store";

            const assetCode = asset.assetCode ?? "Unknown Asset";
            const assetTypeName = asset.assetType?.name ?? "Unknown Type";
            const brandModel = `${asset.brand ?? "Unknown Brand"} ${asset.model ?? "Unknown Model"}`;
            const serialNumber = asset.serialNumber ?? "-";
            const status = asset.status ?? "UNKNOWN";

            return (
              <tr key={asset.id}>
                <td className="px-4 py-4 text-sm font-medium">
                  <Link
                    href={`/assets/${asset.id}`}
                    className="text-[var(--nav)] hover:text-[var(--accent)]"
                  >
                    {assetCode}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm">{assetTypeName}</td>
                <td className="px-4 py-4 text-sm text-[var(--muted)]">{brandModel}</td>
                <td className="px-4 py-4 text-sm">{serialNumber}</td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge value={status} />
                </td>
                <td className="px-4 py-4 text-sm">{workstationCode}</td>
              </tr>
            );
          })}
        </DataTable>
      </div>
    </div>
  );
}