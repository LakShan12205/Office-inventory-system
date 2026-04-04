"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/ui/stat-card";
import { AssetRecord, ReplacementRecord } from "@/lib/types";

type FlowCode = "Flow-01" | "Flow-02";
type ReplacementSource = "WORKSTATION_DEVICE" | "OTHER_DEVICE";

function getFlowWorkstations(flowCode: FlowCode) {
  return flowCode === "Flow-01"
    ? ["WS-07", "WS-08", "WS-09", "WS-10", "WS-11", "WS-12"]
    : ["WS-01", "WS-02", "WS-03", "WS-04", "WS-05", "WS-06"];
}

function getFlowCodeFromWorkstationCode(workstationCode: string): FlowCode {
  const numericCode = Number(workstationCode.split("-")[1]);
  return numericCode >= 7 ? "Flow-01" : "Flow-02";
}

function assetLocationLabel(asset: AssetRecord) {
  return (
    asset.currentLocationDisplay ??
    asset.displayLocation ??
    asset.generalLocation ??
    asset.currentLocation ??
    asset.workstationCode ??
    asset.workstationAssignments.find((assignment) => assignment.isActive)?.workstation.code ??
    "Not recorded"
  );
}

function isWorkstationDevice(asset: AssetRecord) {
  return (
    asset.assetScope === "Workstation Device" ||
    asset.workstationAssignments.some((assignment) => assignment.isActive)
  );
}

function getReplacementRecordStatus(record: ReplacementRecord) {
  const expected = record.repair?.expectedReturnDate;
  if (record.isReturned) return "RETURNED";
  if (record.replacementType === "PERMANENT") return "PERMANENT";
  if (expected && new Date(expected) < new Date()) return "OVERDUE";
  return "ACTIVE";
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M7 7h11" />
      <path d="m15 4 3 3-3 3" />
      <path d="M17 17H6" />
      <path d="m9 14-3 3 3 3" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" />
      <path d="M12 12v8" />
      <path d="M4.5 8.8 12 13l7.5-4.2" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function ReplacementsWorkspace({
  assets,
  replacements
}: {
  assets: AssetRecord[];
  replacements: ReplacementRecord[];
}) {
  const router = useRouter();
  const [assetSource, setAssetSource] = useState<ReplacementSource>("WORKSTATION_DEVICE");
  const [search, setSearch] = useState("");
  const [flow, setFlow] = useState("");
  const [workstation, setWorkstation] = useState("");
  const [deviceType, setDeviceType] = useState("");
  const [generalLocation, setGeneralLocation] = useState("");

  const inventoryCandidates = useMemo(
    () =>
      assets
        .filter((asset) => asset.status !== "RETIRED")
        .sort((a, b) => a.assetCode.localeCompare(b.assetCode)),
    [assets]
  );

  const filtered = useMemo(() => {
    return inventoryCandidates.filter((asset) => {
      const activeAssignment = asset.workstationAssignments.find((assignment) => assignment.isActive);
      const assetSourceType = isWorkstationDevice(asset) ? "WORKSTATION_DEVICE" : "OTHER_DEVICE";
      const assetFlow =
        asset.flow ??
        (activeAssignment?.workstation.code
          ? getFlowCodeFromWorkstationCode(activeAssignment.workstation.code)
          : "");
      const assetWorkstation = asset.workstationCode ?? activeAssignment?.workstation.code ?? "";
      const assetDeviceType = asset.assetType.name;
      const assetLocation = assetLocationLabel(asset);
      const assetGeneralLocation =
        asset.generalLocation ?? asset.currentLocationDisplay ?? asset.currentLocation ?? "";

      const matchesSource = assetSourceType === assetSource;
      const matchesFlow = assetSource === "WORKSTATION_DEVICE" ? !flow || assetFlow === flow : true;
      const matchesWorkstation =
        assetSource === "WORKSTATION_DEVICE"
          ? !workstation || assetWorkstation === workstation
          : true;
      const matchesDeviceType = !deviceType || assetDeviceType === deviceType;
      const matchesGeneralLocation =
        assetSource === "OTHER_DEVICE"
          ? !generalLocation || assetGeneralLocation === generalLocation
          : true;
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        [
          asset.assetCode,
          asset.serialNumber,
          asset.brand,
          asset.model,
          assetDeviceType,
          assetFlow,
          assetWorkstation,
          assetGeneralLocation,
          assetLocation
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

      return (
        matchesSource &&
        matchesFlow &&
        matchesWorkstation &&
        matchesDeviceType &&
        matchesGeneralLocation &&
        matchesSearch
      );
    });
  }, [assets, assetSource, deviceType, flow, generalLocation, inventoryCandidates, search, workstation]);

  const visibleAssets =
    assetSource === "WORKSTATION_DEVICE"
      ? flow && workstation
        ? filtered
        : []
      : filtered;

  const workstationOptions = flow
    ? getFlowWorkstations(flow as FlowCode)
    : [
        "WS-01",
        "WS-02",
        "WS-03",
        "WS-04",
        "WS-05",
        "WS-06",
        "WS-07",
        "WS-08",
        "WS-09",
        "WS-10",
        "WS-11",
        "WS-12"
      ];

  const generalLocationOptions = Array.from(
    new Set(
      inventoryCandidates
        .filter((asset) => !isWorkstationDevice(asset))
        .map(
          (asset) =>
            asset.generalLocation ?? asset.currentLocationDisplay ?? asset.currentLocation ?? ""
        )
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const deviceOptions = Array.from(
    new Set(inventoryCandidates.map((item) => item.assetType.name))
  ).sort((a, b) => a.localeCompare(b));
  const replacementSummary = useMemo(
    () => ({
      active: replacements.filter((record) => getReplacementRecordStatus(record) === "ACTIVE").length,
      returned: replacements.filter((record) => getReplacementRecordStatus(record) === "RETURNED").length,
      permanent: replacements.filter((record) => getReplacementRecordStatus(record) === "PERMANENT").length,
      overdue: replacements.filter((record) => getReplacementRecordStatus(record) === "OVERDUE").length
    }),
    [replacements]
  );

  function goToReplacementForm(asset: AssetRecord) {
    router.push(`/replacements/new?assetId=${encodeURIComponent(asset.id)}`);
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/replacements?status=active",
            label: "Active Replacements",
            value: replacementSummary.active,
            icon: <SwapIcon />,
            badge: "Active" as const,
            tone: "navy" as const
          },
          {
            href: "/replacements?status=returned",
            label: "Returned Replacements",
            value: replacementSummary.returned,
            icon: <CheckIcon />,
            badge: "Returned" as const,
            tone: "emerald" as const
          },
          {
            href: "/replacements?status=permanent",
            label: "Permanent Replacements",
            value: replacementSummary.permanent,
            icon: <BoxIcon />,
            badge: "Permanent" as const,
            tone: "amber" as const
          },
          {
            href: "/replacements?status=overdue",
            label: "Overdue Replacements",
            value: replacementSummary.overdue,
            icon: <AlertIcon />,
            badge: "Overdue" as const,
            tone: "rose" as const
          }
        ].map((card) => (
          <Link key={card.label} href={card.href} className="block h-full">
            <StatCard
              compact
              interactive
              label={card.label}
              value={card.value}
              icon={card.icon}
              badge={card.badge}
              tone={card.tone}
            />
          </Link>
        ))}
      </div>

      <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--nav)]">Asset Scope / Device Source</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Choose how the original device should be located before creating the replacement record.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {[
            {
              value: "WORKSTATION_DEVICE" as const,
              title: "Workstation Device",
              description: "Search using workstation-linked inventory assets."
            },
            {
              value: "OTHER_DEVICE" as const,
              title: "Other / Non-Workstation Device",
              description: "Search using inventory assets that are not assigned to a workstation."
            }
          ].map((scope) => (
            <button
              key={scope.value}
              type="button"
              onClick={() => {
                setAssetSource(scope.value);
                setSearch("");
                setDeviceType("");
                setFlow("");
                setWorkstation("");
                setGeneralLocation("");
              }}
              className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                assetSource === scope.value
                  ? "border-[var(--nav)] bg-[var(--panel-strong)]"
                  : "border-[var(--border)] bg-white hover:bg-[var(--panel-strong)]"
              }`}
            >
              <p className="text-sm font-semibold text-[var(--nav)]">{scope.title}</p>
              <p className="mt-1 text-sm text-[var(--muted)]">{scope.description}</p>
            </button>
          ))}
        </div>
      </section>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Original Device Selection
          </p>
          <h2 className="text-xl font-semibold text-[var(--nav)]">
            Start by selecting the damaged or faulty device
          </h2>
          <p className="text-sm text-[var(--muted)]">
            First select the original device from inventory. Then choose an eligible replacement asset and complete the replacement form.
          </p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            {assetSource === "WORKSTATION_DEVICE"
              ? "Locate Workstation Device"
              : "Locate Other Device"}
          </p>
          <p className="text-sm text-[var(--muted)]">
            {assetSource === "WORKSTATION_DEVICE"
              ? "Use the filters below to find a workstation-linked inventory asset."
              : "Use the filters below to find an existing non-workstation inventory asset."} Replacement records can only be created for assets that already exist in inventory.
          </p>
        </div>

        {assetSource === "WORKSTATION_DEVICE" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--nav)]">
                Workstation Device Selection
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--text)]">Select Flow</span>
                <select
                  value={flow}
                  onChange={(event) => {
                    setFlow(event.target.value);
                    setWorkstation("");
                  }}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <option value="">Select flow</option>
                  <option value="Flow-01">Flow-01</option>
                  <option value="Flow-02">Flow-02</option>
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--text)]">Select Workstation</span>
                {flow ? (
                  <select
                    value={workstation}
                    onChange={(event) => {
                      setWorkstation(event.target.value);
                    }}
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  >
                    <option value="">Select workstation</option>
                    {workstationOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                    Select a flow first to continue.
                  </div>
                )}
              </label>
            </div>

            {workstation ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[180px_1fr]">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--text)]">Device Type</span>
                  <select
                    value={deviceType}
                    onChange={(event) => {
                      setDeviceType(event.target.value);
                    }}
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  >
                    <option value="">All device types</option>
                    {deviceOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-medium text-[var(--text)]">Search</span>
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value);
                    }}
                    placeholder="Search original asset code, workstation, or device"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  />
                </label>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                Select a workstation to load its assigned inventory assets.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--nav)]">
                Other Inventory Asset Selection
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Filters apply automatically as you select a type, location, or search term.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[180px_220px_1fr]">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--text)]">Asset Type Filter</span>
                <select
                  value={deviceType}
                  onChange={(event) => {
                    setDeviceType(event.target.value);
                  }}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <option value="">All Asset Types</option>
                  {deviceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--text)]">General Location Filter</span>
                <select
                  value={generalLocation}
                  onChange={(event) => {
                    setGeneralLocation(event.target.value);
                  }}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <option value="">All Locations</option>
                  {generalLocationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-[var(--text)]">Search</span>
                <input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                  }}
                  placeholder="Code, serial, brand, or model"
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-3 shadow-sm">
        <div className="space-y-2">
          {visibleAssets.map((asset) => {
            const locationLabel = assetLocationLabel(asset);

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => goToReplacementForm(asset)}
                className="flex w-full items-center gap-3 rounded-2xl border border-transparent bg-white/70 px-4 py-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--border)] hover:bg-white hover:shadow-sm"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-3">
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Inventory Code
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--nav)]">{asset.assetCode}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Device Type
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">{asset.assetType.name}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        {assetSource === "WORKSTATION_DEVICE"
                          ? "Workstation Location"
                          : "General Location"}
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">{locationLabel}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                        Brand / Model
                      </p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">
                        {asset.brand} / {asset.model}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-[var(--muted)]">
                    <span>Click to select this device and open the replacement form.</span>
                    <span className="font-medium text-[var(--nav)]">Open Form</span>
                  </div>
                </div>
              </button>
            );
          })}

          {assetSource === "WORKSTATION_DEVICE" && (!flow || !workstation) ? null : visibleAssets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-8 text-center text-sm text-[var(--muted)]">
              No damaged or original devices match your current filters.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
