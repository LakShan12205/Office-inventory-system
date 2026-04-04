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
  currentLocationDisplay?: string | null;
  displayLocation?: string | null;
  assetScope?: string | null;
  generalLocation?: string | null;
  specificLocationNotes?: string | null;
  flow?: string | null;
  side?: string | null;
  workstationCode?: string | null;
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

type AssetPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  start: number;
  end: number;
};

type AssetsResponse = {
  items: AssetPageRecord[];
  pagination: AssetPagination;
};

const QUICK_TYPE_BUTTONS = [
  { label: "All", value: "" },
  { label: "Monitors", value: "Monitor" },
  { label: "Machines", value: "Machine" },
  { label: "UPS", value: "UPS" },
  { label: "Peripherals", value: "Peripheral" }
];

const TYPE_OPTIONS = [
  { label: "All", value: "" },
  { label: "Monitor", value: "Monitor" },
  { label: "Machine", value: "Machine" },
  { label: "UPS", value: "UPS" },
  { label: "Keyboard", value: "Keyboard" },
  { label: "Mouse", value: "Mouse" },
  { label: "Tablet", value: "Tablet" },
  { label: "Phone", value: "Phone" },
  { label: "TV", value: "TV" },
  { label: "Cable", value: "Cable" },
  { label: "Peripheral", value: "Peripheral" }
];

const LOCATION_OPTIONS = [
  {
    label: "Workstations",
    options: Array.from({ length: 12 }, (_, index) => {
      const code = `WS-${String(index + 1).padStart(2, "0")}`;
      return { label: code, value: code };
    })
  },
  {
    label: "Other Locations",
    options: [
      { label: "Ground Floor", value: "Ground Floor" },
      { label: "1st Flow", value: "1st Flow" },
      { label: "2nd Flow", value: "2nd Flow" },
      { label: "3rd Flow", value: "3rd Flow" },
      { label: "Meeting Room", value: "Meeting Room" },
      { label: "Admin Office", value: "Admin Office" },
      { label: "Reception", value: "Reception" },
      { label: "Store", value: "Store" }
    ]
  }
];

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function getAssetTypeIcon(type?: string | null) {
  const iconClass = "h-4 w-4 fill-none stroke-current stroke-[1.8]";
  const normalized = type?.toLowerCase() ?? "";

  if (normalized.includes("monitor") || normalized.includes("tv")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
        <path d="M9 19.5h6" />
        <path d="M12 15.5v4" />
      </svg>
    );
  }

  if (normalized.includes("machine")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="4.5" y="5.5" width="15" height="10" rx="2" />
        <path d="M8.5 18.5h7" />
        <path d="M12 15.5v3" />
      </svg>
    );
  }

  if (normalized.includes("ups")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="6" y="4.5" width="12" height="15" rx="2" />
        <path d="M10 9.5h4" />
        <path d="M10 13.5h4" />
      </svg>
    );
  }

  if (normalized.includes("keyboard") || normalized.includes("mouse")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="3.5" y="8.5" width="17" height="7" rx="2" />
        <path d="M7 12h.01" />
        <path d="M10 12h.01" />
        <path d="M13 12h.01" />
        <path d="M16 12h.01" />
      </svg>
    );
  }

  if (normalized.includes("tablet") || normalized.includes("phone")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <rect x="7" y="3.5" width="10" height="17" rx="2" />
        <path d="M11 17.5h2" />
      </svg>
    );
  }

  if (normalized.includes("cable")) {
    return (
      <svg viewBox="0 0 24 24" className={iconClass}>
        <path d="M8 7.5v4a4 4 0 0 0 8 0v-3" />
        <path d="M6 5.5h4v2H6z" />
        <path d="M14 4.5h4v3h-4z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={iconClass}>
      <path d="M4 8.5 12 5l8 3.5L12 12 4 8.5Z" />
      <path d="M4 12.5 12 16l8-3.5" />
      <path d="M4 16.5 12 20l8-3.5" />
    </svg>
  );
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
  appendQueryParam(query, "location", params?.location);
  appendQueryParam(query, "page", params?.page);
  appendQueryParam(query, "pageSize", params?.pageSize);

  let assets: AssetPageRecord[] = [];
  let pagination: AssetPagination = {
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
    start: 0,
    end: 0
  };

  try {
    const result = (await getAssets(
      query.toString() ? `?${query.toString()}` : ""
    )) as AssetPageRecord[] | AssetsResponse;

    if ("items" in (result as AssetsResponse) && Array.isArray((result as AssetsResponse).items)) {
      assets = (result as AssetsResponse).items;
      pagination = (result as AssetsResponse).pagination;
    } else {
      assets = normalizeAssets(result);
      pagination = {
        page: 1,
        pageSize: assets.length || 25,
        total: assets.length,
        totalPages: 1,
        start: assets.length ? 1 : 0,
        end: assets.length
      };
    }
  } catch (error) {
    console.error("Assets error:", error);
    return <div>Failed to load assets</div>;
  }

  const activeAssets = assets.filter((asset) => asset.status === "ACTIVE").length;
  const repairAssets = assets.filter((asset) => asset.status === "IN_REPAIR").length;
  const assignedAssets = assets.filter(
    (asset) => asset.workstationAssignments?.[0]?.workstation?.code || asset.workstation?.code
  ).length;
  const selectedType = typeof params?.type === "string" ? params.type : "";
  const currentPageSize =
    typeof params?.pageSize === "string" && ["25", "50", "100"].includes(params.pageSize)
      ? params.pageSize
      : String(pagination.pageSize);
  const createAssetsHref = ({
    search = typeof params?.search === "string" ? params.search : undefined,
    type = selectedType || undefined,
    status = typeof params?.status === "string" ? params.status : undefined,
    location = typeof params?.location === "string" ? params.location : undefined,
    page = pagination.page,
    pageSize = currentPageSize
  }: {
    search?: string;
    type?: string;
    status?: string;
    location?: string;
    page?: number | string;
    pageSize?: string;
  }) => {
    const nextQuery = new URLSearchParams();
    appendQueryParam(nextQuery, "search", search);
    appendQueryParam(nextQuery, "type", type);
    appendQueryParam(nextQuery, "status", status);
    appendQueryParam(nextQuery, "location", location);
    appendQueryParam(nextQuery, "page", String(page));
    appendQueryParam(nextQuery, "pageSize", pageSize);
    const serialized = nextQuery.toString();
    return serialized ? `/assets?${serialized}` : "/assets";
  };
  const hasFilters = Boolean(
    typeof params?.search === "string" && params.search.trim()
      || typeof params?.type === "string" && params.type.trim()
      || typeof params?.status === "string" && params.status.trim()
      || typeof params?.location === "string" && params.location.trim()
  );

  return (
    <div className="space-y-5">
      <PageHeader
        title="Assets"
        description="Search and manage all assets."
        action={
          <Link
            href="/assets/new"
            className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--nav),var(--accent))] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(24,49,83,0.20)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(24,49,83,0.26)]"
          >
            <PlusIcon />
            Add Asset
          </Link>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Total assets</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{pagination.total}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Active</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{activeAssets}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Assigned / In repair</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{assignedAssets} / {repairAssets}</p>
        </div>
      </div>

      {/* FILTER */}
      <div className="rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,255,255,0.94))] p-5 shadow-[0_18px_50px_rgba(24,49,83,0.07)]">
        <div className="mb-4 flex flex-wrap gap-2">
          {QUICK_TYPE_BUTTONS.map((button) => {
            const isActive = (selectedType || "") === button.value;
            return (
              <Link
                key={button.label}
                href={createAssetsHref({ type: button.value || undefined, page: 1 })}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  isActive
                    ? "bg-[var(--nav)] text-white shadow-[0_12px_28px_rgba(24,49,83,0.18)]"
                    : "border border-[var(--border)] bg-white text-[var(--nav)] hover:bg-[var(--panel-strong)]"
                }`}
              >
                {button.label}
              </Link>
            );
          })}
        </div>
        <form className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <input
            name="search"
            defaultValue={typeof params?.search === "string" ? params.search : ""}
            placeholder="Search code, serial, brand, model"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          <select
            name="type"
            defaultValue={selectedType}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            name="status"
            defaultValue={typeof params?.status === "string" ? params.status : ""}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">All</option>
            <option value="ACTIVE">Active</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="IN_STORE">In Store</option>
            <option value="DAMAGED">Damaged</option>
          </select>
          <select
            name="location"
            defaultValue={typeof params?.location === "string" ? params.location : ""}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">All locations</option>
            {LOCATION_OPTIONS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <div className="flex gap-3">
            <button className="flex-1 rounded-2xl bg-[var(--nav)] px-5 py-3 font-semibold text-white shadow-[0_14px_30px_rgba(24,49,83,0.18)] transition hover:bg-[#214067]">
              Filter
            </button>
            {hasFilters ? (
              <Link
                href="/assets"
                className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-4 py-3 font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
              >
                Reset
              </Link>
            ) : null}
          </div>
          <input type="hidden" name="page" value="1" />
          <input type="hidden" name="pageSize" value={currentPageSize} />
        </form>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-[var(--muted)]">
          {pagination.total > 0
            ? `Showing ${pagination.start}-${pagination.end} of ${pagination.total} assets`
            : "No assets match your filters"}
        </p>
        <form className="flex items-center gap-3" action="/assets">
          <input type="hidden" name="search" value={typeof params?.search === "string" ? params.search : ""} />
          <input type="hidden" name="type" value={typeof params?.type === "string" ? params.type : ""} />
          <input type="hidden" name="status" value={typeof params?.status === "string" ? params.status : ""} />
          <input type="hidden" name="location" value={typeof params?.location === "string" ? params.location : ""} />
          <input type="hidden" name="page" value="1" />
          <label className="text-sm font-medium text-[var(--muted)]" htmlFor="page-size">
            Page size
          </label>
          <select
            id="page-size"
            name="pageSize"
            defaultValue={currentPageSize}
            className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm"
          >
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <button className="rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]">
            Filter
          </button>
        </form>
      </div>

      {/* TABLE */}
      <div className="rounded-[1.75rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,255,255,0.94))] p-5 shadow-[0_18px_50px_rgba(24,49,83,0.07)]">
        {assets.length > 0 ? (
          <DataTable
            stickyHeader
            headers={[
              "Asset Code",
              "Type",
              "Brand / Model",
              "Status",
              "Location"
            ]}
          >
            {assets.map((asset, index) => {
              const displayLocation =
                asset.currentLocationDisplay ??
                asset.displayLocation ??
                (asset.workstationCode && asset.side
                  ? `${asset.workstationCode} / ${asset.side}`
                  : asset.workstationCode ??
                    asset.generalLocation ??
                    asset.currentLocation ??
                    asset.workstationAssignments?.[0]?.workstation?.code ??
                    asset.workstation?.code ??
                    "Store");
              const href = `/assets/${asset.id}`;

              return (
                <tr
                  key={asset.id}
                  className={`${index % 2 === 0 ? "bg-white" : "bg-[#fcf8f1]"} cursor-pointer`}
                >
                  <td className="px-4 py-4 text-sm font-medium">
                    <Link href={href} className="flex items-center justify-between gap-2 text-[var(--nav)] hover:text-[var(--accent)]">
                      <span>{asset.assetCode ?? "Unknown"}</span>
                      <ArrowRightIcon />
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <Link href={href} className="flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--panel-strong)] text-[var(--nav)]">
                        {getAssetTypeIcon(asset.assetType?.name)}
                      </span>
                      <span className="font-medium text-[var(--text)]">{asset.assetType?.name ?? "N/A"}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--text)]">
                    <Link href={href}>{(asset.brand ?? "-") + " " + (asset.model ?? "")}</Link>
                  </td>
                  <td className="px-4 py-4 text-sm">
                    <Link href={href}>
                      <StatusBadge value={asset.status ?? "UNKNOWN"} />
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--muted)]">
                    <Link href={href}>{displayLocation}</Link>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/60 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--nav)]">No assets match your filters</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Try changing your search, status, type, or location filters.</p>
          </div>
        )}

        <div className="mt-5 flex flex-col gap-3 border-t border-[var(--border)] pt-5 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-[var(--muted)]">
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-3">
            <Link
              href={createAssetsHref({ page: Math.max(1, pagination.page - 1) })}
              aria-disabled={pagination.page <= 1}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                pagination.page <= 1
                  ? "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                  : "border-[var(--border)] bg-white text-[var(--nav)] hover:bg-[var(--panel-strong)]"
              }`}
            >
              Previous
            </Link>
            <Link
              href={createAssetsHref({ page: Math.min(pagination.totalPages, pagination.page + 1) })}
              aria-disabled={pagination.page >= pagination.totalPages}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                pagination.page >= pagination.totalPages
                  ? "pointer-events-none border-slate-200 bg-slate-100 text-slate-400"
                  : "border-[var(--border)] bg-white text-[var(--nav)] hover:bg-[var(--panel-strong)]"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
