"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

const QUICK_FILTERS = [
  { label: "All", priority: "", status: "" },
  { label: "High", priority: "HIGH", status: "" },
  { label: "Medium", priority: "MEDIUM", status: "" },
  { label: "New", priority: "", status: "NEW" }
];

export function AlertsFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const updateFilter = (key: "status" | "priority", value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    const href = next.toString() ? `${pathname}?${next.toString()}` : pathname;
    router.replace(href);
  };

  const applyQuickFilter = (priority: string, status: string) => {
    const next = new URLSearchParams(searchParams.toString());

    if (priority) next.set("priority", priority);
    else next.delete("priority");

    if (status) next.set("status", status);
    else next.delete("status");

    const href = next.toString() ? `${pathname}?${next.toString()}` : pathname;
    router.replace(href);
  };

  const selectedPriority = searchParams.get("priority") ?? "";
  const selectedStatus = searchParams.get("status") ?? "";

  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap gap-2">
        {QUICK_FILTERS.map((filter) => {
          const isActive = selectedPriority === filter.priority && selectedStatus === filter.status;
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => applyQuickFilter(filter.priority, filter.status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive
                  ? "bg-[var(--nav)] text-white shadow-[0_12px_28px_rgba(24,49,83,0.18)]"
                  : "border border-[var(--border)] bg-white text-[var(--nav)] hover:bg-[var(--panel-strong)]"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <select
          value={selectedStatus}
          onChange={(event) => updateFilter("status", event.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        >
          <option value="">All statuses</option>
          <option value="NEW">New</option>
          <option value="READ">Read</option>
          <option value="RESOLVED">Resolved</option>
        </select>
        <select
          value={selectedPriority}
          onChange={(event) => updateFilter("priority", event.target.value)}
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        >
          <option value="">All priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>
    </div>
  );
}
