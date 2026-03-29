import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getWorkstations } from "@/lib/api";
import { appendQueryParam } from "@/lib/query";

type WorkstationAssetItem = {
  id?: string;
  assignmentType?: string;
  asset?: {
    id?: string;
    assetCode?: string;
    assetType?: {
      name?: string;
    };
  };
};

type WorkstationPageItem = {
  id: string;
  code: string;
  name?: string;
  location?: string;
  status?: string;
  assets?: WorkstationAssetItem[];
  _count?: {
    assets?: number;
    repairs?: number;
  };
  assetCount?: number;
  machineCount?: number;
};

function normalizeWorkstations(input: unknown): WorkstationPageItem[] {
  if (Array.isArray(input)) {
    return input as WorkstationPageItem[];
  }

  if (input && typeof input === "object") {
    const value = input as {
      items?: unknown;
      data?: unknown;
      workstations?: unknown;
    };

    if (Array.isArray(value.items)) {
      return value.items as WorkstationPageItem[];
    }

    if (Array.isArray(value.data)) {
      return value.data as WorkstationPageItem[];
    }

    if (Array.isArray(value.workstations)) {
      return value.workstations as WorkstationPageItem[];
    }
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
    const result = await getWorkstations(query.toString() ? `?${query.toString()}` : "");
    workstations = normalizeWorkstations(result);
  } catch (error) {
    console.error("Failed to load workstations page:", error);

    return (
      <div className="space-y-5">
        <PageHeader
          title="Workstations"
          description="Review all workstations, current asset counts, workstation health, and whether any replacement machine is active."
        />
        <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
          <p className="text-sm text-red-600">Failed to load workstations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Workstations"
        description="Review all 12 workstations, current asset counts, workstation health, and whether any replacement machine is active."
      />

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <input
            name="search"
            defaultValue={typeof params?.search === "string" ? params.search : ""}
            placeholder="Search by workstation code"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          <select
            name="status"
            defaultValue={typeof params?.status === "string" ? params.status : ""}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="NEEDS_ATTENTION">Needs Attention</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white">
            Apply filters
          </button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {workstations.map((workstation) => {
          const assets = Array.isArray(workstation.assets) ? workstation.assets : [];

          const machineCount =
            workstation.machineCount ??
            assets.filter((item) => item?.asset?.assetType?.name === "Machine").length;

          const activeReplacement = assets.find(
            (item) =>
              item?.assignmentType === "TEMPORARY_REPLACEMENT" ||
              item?.assignmentType === "Temporary Replacement"
          );

          const assetCount =
            workstation._count?.assets ?? workstation.assetCount ?? assets.length;

          const repairCount = workstation._count?.repairs ?? 0;

          return (
            <Link
              key={workstation.id}
              href={`/workstations/${workstation.id}`}
              className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--muted)]">
                    {workstation.code}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold">
                    {workstation.name ?? workstation.code}
                  </h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {workstation.location ?? "No location"}
                  </p>
                </div>
                <StatusBadge value={workstation.status ?? "UNKNOWN"} />
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl bg-[var(--panel-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Assigned assets
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{assetCount}</p>
                </div>
                <div className="rounded-2xl bg-[var(--panel-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Machines
                  </p>
                  <p className="mt-2 text-2xl font-semibold">{machineCount}</p>
                </div>
                <div className="rounded-2xl bg-[var(--panel-strong)] px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
                    Replacement
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    {activeReplacement?.asset?.assetCode ?? "None active"}
                  </p>
                </div>
              </div>

              <div className="mt-4 text-xs text-[var(--muted)]">
                Open repairs: {repairCount}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <DataTable headers={["Code", "Location", "Status", "Assets", "Machines", "Open Repairs"]}>
          {workstations.map((workstation) => {
            const assets = Array.isArray(workstation.assets) ? workstation.assets : [];

            const machineCount =
              workstation.machineCount ??
              assets.filter((item) => item?.asset?.assetType?.name === "Machine").length;

            const assetCount =
              workstation._count?.assets ?? workstation.assetCount ?? assets.length;

            const repairCount = workstation._count?.repairs ?? 0;

            return (
              <tr key={workstation.id}>
                <td className="px-4 py-4 text-sm font-medium">
                  <Link
                    href={`/workstations/${workstation.id}`}
                    className="text-[var(--nav)] hover:text-[var(--accent)]"
                  >
                    {workstation.code}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm">{workstation.location ?? "No location"}</td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge value={workstation.status ?? "UNKNOWN"} />
                </td>
                <td className="px-4 py-4 text-sm">{assetCount}</td>
                <td className="px-4 py-4 text-sm">{machineCount}</td>
                <td className="px-4 py-4 text-sm">{repairCount}</td>
              </tr>
            );
          })}
        </DataTable>
      </div>
    </div>
  );
}