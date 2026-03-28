import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAssets } from "@/lib/api";
import { appendQueryParam } from "@/lib/query";

type AssetPageRecord = {
  id: string;
  assetCode: string;
  brand: string;
  model: string;
  serialNumber?: string | null;
  status: string;
  currentLocation?: string | null;
  assetType: {
    id: string;
    name: string;
  };
  workstation?: {
    id: string;
    code: string;
  } | null;
  workstationAssignments?: Array<{
    workstation: {
      id: string;
      code: string;
    };
  }>;
};

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

  const assets = (await getAssets(
    query.toString() ? `?${query.toString()}` : ""
  )) as AssetPageRecord[];

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
              asset.workstationAssignments?.[0]?.workstation.code ||
              asset.workstation?.code ||
              asset.currentLocation ||
              "Store";

            return (
              <tr key={asset.id}>
                <td className="px-4 py-4 text-sm font-medium">
                  <Link href={`/assets/${asset.id}`} className="text-[var(--nav)] hover:text-[var(--accent)]">
                    {asset.assetCode}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm">{asset.assetType.name}</td>
                <td className="px-4 py-4 text-sm text-[var(--muted)]">
                  {asset.brand} {asset.model}
                </td>
                <td className="px-4 py-4 text-sm">{asset.serialNumber || "-"}</td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge value={asset.status} />
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