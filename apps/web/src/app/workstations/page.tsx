import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getWorkstations } from "@/lib/api";
import { appendQueryParam } from "@/lib/query";

type WorkstationPageItem = {
  id: string;
  code: string;
  name?: string;
  location?: string;
  status?: string;
  assets?: Array<{
    id: string;
    asset?: {
      id: string;
      assetCode?: string;
      assetType?: { name?: string };
    };
    assignmentType?: string;
  }>;
  _count?: {
    assets?: number;
    repairs?: number;
  };
  assetCount?: number;
  machineCount?: number;
};

function normalizeWorkstations(input: unknown): WorkstationPageItem[] {
  if (Array.isArray(input)) return input as WorkstationPageItem[];

  if (input && typeof input === "object") {
    const value = input as any;

    if (Array.isArray(value.items)) return value.items;
    if (Array.isArray(value.data)) return value.data;
    if (Array.isArray(value.workstations)) return value.workstations;
  }

  return [];
}

export default async function WorkstationsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  appendQueryParam(query, "search", params?.search);
  appendQueryParam(query, "status", params?.status);

  let workstations: WorkstationPageItem[] = [];

  try {
    const result = await getWorkstations(
      query.toString() ? `?${query.toString()}` : ""
    );
    workstations = normalizeWorkstations(result);
  } catch (error) {
    console.error("Workstations error:", error);
    return <div>Failed to load workstations</div>;
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Workstations"
        description="Review all workstations and their asset usage."
      />

      {/* FILTER */}
      <div className="rounded-[1.75rem] border p-5">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <input
            name="search"
            defaultValue={typeof params?.search === "string" ? params.search : ""}
            placeholder="Search workstation"
            className="border px-4 py-2 rounded"
          />
          <select
            name="status"
            defaultValue={typeof params?.status === "string" ? params.status : ""}
            className="border px-4 py-2 rounded"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button className="bg-black text-white px-4 py-2 rounded">
            Filter
          </button>
        </form>
      </div>

      {/* CARDS */}
      <div className="grid gap-4 xl:grid-cols-2">
        {workstations.map((ws) => {
          const assets = Array.isArray(ws.assets) ? ws.assets : [];

          const machineCount =
            ws.machineCount ??
            assets.filter(
              (a) => a?.asset?.assetType?.name === "Machine"
            ).length;

          const assetCount =
            ws._count?.assets ?? ws.assetCount ?? assets.length;

          const repairCount = ws._count?.repairs ?? 0;

          const activeReplacement = assets.find(
            (a) =>
              a?.assignmentType === "TEMPORARY_REPLACEMENT" ||
              a?.assignmentType === "Temporary Replacement"
          );

          return (
            <Link
              key={ws.id}
              href={`/workstations/${ws.id}`}
              className="border p-5 rounded"
            >
              <h2 className="text-lg font-bold">
                {ws.name ?? ws.code}
              </h2>

              <p>{ws.location ?? "No location"}</p>

              <StatusBadge value={ws.status ?? "UNKNOWN"} />

              <div className="mt-3">
                <p>Assets: {assetCount}</p>
                <p>Machines: {machineCount}</p>
                <p>Repairs: {repairCount}</p>
                <p>
                  Replacement:{" "}
                  {activeReplacement?.asset?.assetCode ?? "None"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="border p-5 rounded">
        <DataTable headers={["Code", "Location", "Status", "Assets"]}>
          {workstations.map((ws) => {
            const assets = Array.isArray(ws.assets) ? ws.assets : [];

            const assetCount =
              ws._count?.assets ?? ws.assetCount ?? assets.length;

            return (
              <tr key={ws.id}>
                <td>
                  <Link href={`/workstations/${ws.id}`}>
                    {ws.code}
                  </Link>
                </td>
                <td>{ws.location ?? "N/A"}</td>
                <td>
                  <StatusBadge value={ws.status ?? "UNKNOWN"} />
                </td>
                <td>{assetCount}</td>
              </tr>
            );
          })}
        </DataTable>
      </div>
    </div>
  );
}