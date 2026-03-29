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

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M4 8.5 12 5l8 3.5L12 12 4 8.5Z" />
      <path d="M4 12.5 12 16l8-3.5" />
      <path d="M4 16.5 12 20l8-3.5" />
    </svg>
  );
}

function MachineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <rect x="4.5" y="5.5" width="15" height="10" rx="2" />
      <path d="M8.5 18.5h7" />
      <path d="M12 15.5v3" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M14 6a4 4 0 0 0 4.7 4.7l-8.4 8.4a2 2 0 1 1-2.8-2.8l8.4-8.4A4 4 0 0 0 14 6Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M7 7h11" />
      <path d="m15 4 3 3-3 3" />
      <path d="M17 17H6" />
      <path d="m9 14-3 3 3 3" />
    </svg>
  );
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
      <div className="rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,255,255,0.94))] p-5 shadow-[0_18px_50px_rgba(24,49,83,0.07)]">
        <form className="grid gap-4 md:grid-cols-[1fr_220px_auto]">
          <input
            name="search"
            defaultValue={typeof params?.search === "string" ? params.search : ""}
            placeholder="Search workstation"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          <select
            name="status"
            defaultValue={typeof params?.status === "string" ? params.status : ""}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <button className="rounded-2xl bg-[var(--nav)] px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(24,49,83,0.18)] transition hover:bg-[#214067]">
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
              className="group relative overflow-hidden rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.95))] p-5 shadow-[0_20px_55px_rgba(24,49,83,0.08)] transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:shadow-[0_28px_80px_rgba(24,49,83,0.14)]"
            >
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--accent)] via-[var(--nav)] to-transparent" />
              <div className="absolute -right-8 top-8 h-24 w-24 rounded-full bg-[var(--accent)]/10 blur-2xl transition duration-300 group-hover:bg-[var(--accent)]/15" />
              <div className="relative">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-[var(--nav)]">
                      {ws.name ?? ws.code}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {ws.location ?? "No location"}
                    </p>
                  </div>
                  <StatusBadge
                    value={ws.status ?? "UNKNOWN"}
                    tone={ws.status === "ACTIVE" ? "success" : ws.status === "NEEDS_ATTENTION" ? "warning" : undefined}
                  />
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--panel-strong)] text-[var(--nav)]">
                        <LayersIcon />
                      </span>
                      Assets
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-[var(--text)]">{assetCount}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--panel-strong)] text-[var(--nav)]">
                        <MachineIcon />
                      </span>
                      Machines
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-[var(--text)]">{machineCount}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--panel-strong)] text-[var(--accent)]">
                        <WrenchIcon />
                      </span>
                      Repairs
                    </div>
                    <p className="mt-3 text-2xl font-semibold text-[var(--text)]">{repairCount}</p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--panel-strong)] text-[var(--warning)]">
                        <SwapIcon />
                      </span>
                      Replacement
                    </div>
                    <p className="mt-3 truncate text-sm font-semibold text-[var(--text)]">
                      {activeReplacement?.asset?.assetCode ?? "None"}
                    </p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,255,255,0.94))] p-5 shadow-[0_18px_50px_rgba(24,49,83,0.07)]">
        <DataTable headers={["Code", "Location", "Status", "Assets"]}>
          {workstations.map((ws) => {
            const assets = Array.isArray(ws.assets) ? ws.assets : [];

            const assetCount =
              ws._count?.assets ?? ws.assetCount ?? assets.length;

            return (
              <tr key={ws.id}>
                <td className="px-4 py-4 text-sm font-medium">
                  <Link href={`/workstations/${ws.id}`} className="text-[var(--nav)] hover:text-[var(--accent)]">
                    {ws.code}
                  </Link>
                </td>
                <td className="px-4 py-4 text-sm text-[var(--muted)]">{ws.location ?? "N/A"}</td>
                <td className="px-4 py-4 text-sm">
                  <StatusBadge value={ws.status ?? "UNKNOWN"} />
                </td>
                <td className="px-4 py-4 text-sm font-medium text-[var(--text)]">{assetCount}</td>
              </tr>
            );
          })}
        </DataTable>
      </div>
    </div>
  );
}
