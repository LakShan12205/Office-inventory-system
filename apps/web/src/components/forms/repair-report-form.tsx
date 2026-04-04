"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRepair } from "@/lib/api";
import { AssetRecord, WorkstationListItem } from "@/lib/types";

type RepairScope = "WORKSTATION_DEVICE" | "OTHER_DEVICE" | "";

type AssetOption = {
  id: string;
  assetCode: string;
  assetType: string;
  serialNumber: string;
  brand: string;
  model: string;
  side?: string | null;
  purchaseDate?: string | null;
  warrantyExpiryDate?: string | null;
  assetScope?: string | null;
  flow?: string | null;
  generalLocation?: string | null;
  specificLocationNotes?: string | null;
  currentWorkstationId?: string;
  currentWorkstationCode?: string;
  currentLocation?: string | null;
  status: string;
  isWorkstationDevice: boolean;
};

function extractSide(asset: AssetRecord) {
  const source = `${asset.notes ?? ""} ${asset.specification ?? ""}`;
  const match = source.match(/Side:\s*(Left|Right)/i);
  return match?.[1] ? `${match[1].charAt(0).toUpperCase()}${match[1].slice(1).toLowerCase()}` : null;
}

function extractMetadata(asset: AssetRecord, label: string) {
  const source = `${asset.notes ?? ""} | ${asset.specification ?? ""}`;
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`${escapedLabel}:\\s*([^|]+)`, "i");
  const match = source.match(pattern);
  return match?.[1]?.trim() ?? null;
}

function normalizeText(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </svg>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function toDateTimeInputValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function RepairReportForm({
  workstations,
  assets
}: {
  workstations: WorkstationListItem[];
  assets: AssetRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const safeAssets = Array.isArray(assets) ? assets : [];
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const assetOptions: AssetOption[] = useMemo(
    () =>
      safeAssets.map((asset) => {
        const activeAssignment = asset.workstationAssignments.find((assignment) => assignment.isActive);
        const assetScope =
          asset.assetScope ??
          extractMetadata(asset, "Asset Scope") ??
          (activeAssignment ? "Workstation Device" : "Other / Non-Workstation Device");
        const generalLocation = asset.generalLocation ?? extractMetadata(asset, "General Location");
        const specificLocationNotes =
          asset.specificLocationNotes ?? extractMetadata(asset, "Specific Location / Notes");
        return {
          id: asset.id,
          assetCode: asset.assetCode,
          assetType: asset.assetType.name,
          serialNumber: asset.serialNumber,
          brand: asset.brand,
          model: asset.model,
          side: extractSide(asset),
          purchaseDate: asset.purchaseDate,
          warrantyExpiryDate: extractMetadata(asset, "Warranty Expiry Date"),
          assetScope,
          flow: asset.flow ?? extractMetadata(asset, "Flow"),
          generalLocation,
          specificLocationNotes,
          currentWorkstationId: activeAssignment?.workstation.id,
          currentWorkstationCode: activeAssignment?.workstation.code,
          currentLocation: asset.currentLocationDisplay ?? asset.displayLocation ?? asset.currentLocation,
          status: asset.status,
          isWorkstationDevice: Boolean(activeAssignment) || assetScope === "Workstation Device"
        };
      }),
    [safeAssets]
  );

  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    repairScope: "" as RepairScope,
    repairFlow: "",
    workstationId: "",
    deviceTypeFilter: "",
    otherAssetTypeFilter: "",
    otherLocationFilter: "",
    otherSearch: "",
    assetId: "",
    reportedDate: "",
    repairTypeCategory: "HARDWARE",
    repairTypeOther: "",
    faultDescription: "",
    repairStage: "CHECKED",
    stageDate: "",
    repairDetails: "",
    handledBy: "",
    remarks: "",
    repairDocumentName: ""
  });

  useEffect(() => {
    setForm((current) => {
      if (current.reportedDate || current.stageDate) return current;
      const now = toDateTimeInputValue();
      return {
        ...current,
        reportedDate: now,
        stageDate: now
      };
    });
  }, []);

  const workstationDeviceAssets = useMemo(
    () => assetOptions.filter((asset) => asset.isWorkstationDevice),
    [assetOptions]
  );

  const otherAssets = useMemo(
    () => assetOptions.filter((asset) => !asset.isWorkstationDevice),
    [assetOptions]
  );

  const filteredOtherAssets = useMemo(() => {
    const query = form.otherSearch.trim().toLowerCase();

    return otherAssets.filter((asset) => {
      const matchesType =
        !form.otherAssetTypeFilter ||
        (form.otherAssetTypeFilter === "Tab"
          ? asset.assetType === "Tablet"
          : asset.assetType === form.otherAssetTypeFilter);

      const matchesLocation =
        !form.otherLocationFilter ||
        normalizeText(asset.generalLocation) === normalizeText(form.otherLocationFilter) ||
        normalizeText(asset.currentLocation) === normalizeText(form.otherLocationFilter) ||
        normalizeText(asset.specificLocationNotes).includes(normalizeText(form.otherLocationFilter)) ||
        normalizeText(asset.flow) === normalizeText(form.otherLocationFilter);

      const matchesSearch =
        !query ||
        [
          asset.assetCode,
          asset.serialNumber,
          asset.brand,
          asset.model,
          asset.generalLocation,
          asset.specificLocationNotes,
          asset.assetScope
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));

      return matchesType && matchesLocation && matchesSearch;
    });
  }, [otherAssets, form.otherAssetTypeFilter, form.otherLocationFilter, form.otherSearch]);

  const flowWorkstations = useMemo(() => {
    if (form.repairFlow === "1st Flow") {
      return workstations.filter((workstation) => ["WS-07", "WS-08", "WS-09", "WS-10", "WS-11", "WS-12"].includes(workstation.code));
    }
    if (form.repairFlow === "2nd Flow") {
      return workstations.filter((workstation) => ["WS-01", "WS-02", "WS-03", "WS-04", "WS-05", "WS-06"].includes(workstation.code));
    }
    return [];
  }, [form.repairFlow, workstations]);

  const workstationAssets = useMemo(() => {
    if (!form.workstationId) return [];
    return workstationDeviceAssets.filter((asset) => asset.currentWorkstationId === form.workstationId);
  }, [workstationDeviceAssets, form.workstationId]);

  const filteredWorkstationAssets = useMemo(() => {
    if (!form.deviceTypeFilter) return workstationAssets;
    return workstationAssets.filter((asset) => {
      const normalizedAssetType = asset.assetType.toLowerCase();
      const normalizedFilter = form.deviceTypeFilter.toLowerCase();
      if (normalizedFilter === "tab") return normalizedAssetType === "tablet";
      return normalizedAssetType === normalizedFilter;
    });
  }, [workstationAssets, form.deviceTypeFilter]);

  const selectedAsset = assetOptions.find((asset) => asset.id === form.assetId);
  const canShowAssetPicker =
    form.repairScope === "WORKSTATION_DEVICE"
      ? Boolean(form.workstationId)
      : form.repairScope === "OTHER_DEVICE";

  function updateField(name: string, value: string) {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateScope(scope: RepairScope) {
    setForm((current) => ({
      ...current,
      repairScope: scope,
      repairFlow: "",
      workstationId: "",
      deviceTypeFilter: "",
      otherAssetTypeFilter: "",
      otherLocationFilter: "",
      otherSearch: "",
      assetId: ""
    }));
  }

  function onFlowChange(flow: string) {
    setForm((current) => ({
      ...current,
      repairFlow: flow,
      workstationId: "",
      deviceTypeFilter: "",
      assetId: "",
      replacementAssetId: "",
      replacementDate: ""
    }));
  }

  function onWorkstationChange(workstationId: string) {
    setForm((current) => ({
      ...current,
      workstationId,
      deviceTypeFilter: "",
      assetId: ""
    }));
  }

  function onAssetChange(assetId: string) {
    const asset = assetOptions.find((item) => item.id === assetId);
    setForm((current) => ({
      ...current,
      assetId,
      workstationId:
        current.repairScope === "WORKSTATION_DEVICE"
          ? asset?.currentWorkstationId || current.workstationId
          : current.workstationId
    }));
  }

  function onRepairDocumentChange(file: File | null) {
    if (!file) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next.repairDocumentName;
        return next;
      });
      setForm((current) => ({
        ...current,
        repairDocumentName: ""
      }));
      return;
    }

    const supportedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const supportedExtensions = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx"];
    const lowerName = file.name.toLowerCase();
    const isSupported =
      supportedTypes.includes(file.type) ||
      supportedExtensions.some((extension) => lowerName.endsWith(extension));

    if (!isSupported) {
      setFieldErrors((current) => ({
        ...current,
        repairDocumentName: "Upload a PDF, image, DOC, or DOCX file."
      }));
      setError("Upload a PDF, image, DOC, or DOCX file.");
      return;
    }

    setError(null);
    setFieldErrors((current) => {
      const next = { ...current };
      delete next.repairDocumentName;
      return next;
    });
    setForm((current) => ({
      ...current,
      repairDocumentName: file?.name ?? ""
    }));
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!selectedAsset) {
      nextErrors.assetId = "Please select an existing inventory asset before submitting.";
    }

    if (!selectedAsset?.assetType) nextErrors.inventoryType = "Inventory Type must come from the selected asset.";
    if (!selectedAsset?.assetCode) nextErrors.inventoryCode = "Inventory Code must come from the selected asset.";
    if (!selectedAsset?.serialNumber) nextErrors.serialNumber = "Serial Number must come from the selected asset.";

    if (!form.repairTypeCategory) nextErrors.repairTypeCategory = "Please select a repair type.";
    if (form.repairTypeCategory === "OTHER" && !form.repairTypeOther.trim()) {
      nextErrors.repairTypeOther = "Please specify the repair type.";
    }
    if (!form.faultDescription.trim()) nextErrors.faultDescription = "Fault is required.";
    if (!form.repairStage) nextErrors.repairStage = "Please select a repair stage.";
    if (!form.stageDate) nextErrors.stageDate = "Stage date is required.";
    if (!form.repairDetails.trim()) nextErrors.repairDetails = "Repair details are required.";
    if (!form.handledBy.trim()) nextErrors.handledBy = "Repaired By is required.";

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!form.repairScope) {
      setError("Please choose a repair source before selecting an asset.");
      return;
    }

    const resolvedWorkstationId =
      form.repairScope === "WORKSTATION_DEVICE"
        ? form.workstationId
        : selectedAsset?.currentWorkstationId || workstations[0]?.id || "";

    if (!validateForm()) {
      setError("Please complete the required repair details.");
      return;
    }

    if (!resolvedWorkstationId) {
      setError("A workstation context could not be resolved for this repair.");
      return;
    }

    startTransition(async () => {
      try {
        const resolvedRepairType =
          form.repairTypeCategory === "SOFTWARE"
            ? "ON_SITE"
            : "SENT_TO_SHOP";

        const resolvedStatus =
          form.repairStage === "CHECKED"
            ? "REPORTED"
            : form.repairStage === "SENT_FOR_REPAIR"
              ? "SENT"
              : form.repairStage === "REPAIR_CARRIED_OUT"
                ? "IN_PROGRESS"
                : "RETURNED";

        const combinedNotes = [
          `Repair Type: ${
            form.repairTypeCategory === "OTHER"
              ? `Other - ${form.repairTypeOther || "Not specified"}`
              : form.repairTypeCategory.replaceAll("_", " ")
          }`,
          form.remarks ? `Remarks: ${form.remarks}` : null,
          form.repairDocumentName ? `Repair Document: ${form.repairDocumentName}` : null
        ]
          .filter(Boolean)
          .join(" | ");

        await createRepair({
          workstationId: resolvedWorkstationId,
          assetId: form.assetId,
          reportedDate: new Date(form.reportedDate).toISOString(),
          faultDescription: form.faultDescription,
          sentTo: null,
          repairType: resolvedRepairType,
          sentDate: form.stageDate ? new Date(form.stageDate).toISOString() : null,
          expectedReturnDate: null,
          actualReturnDate:
            form.repairStage === "RETURNED" && form.stageDate
              ? new Date(form.stageDate).toISOString()
              : null,
          diagnosis: form.repairStage,
          repairAction: form.repairDetails || null,
          partsChanged: null,
          cost: null,
          handledBy: form.handledBy || null,
          notes: combinedNotes || null,
          status: resolvedStatus,
          replacementAssetId: null,
          replacementDate: null,
          replacementStatus: undefined,
          replacementNotes: null
        });

        setSuccessMessage(`Repair saved for ${selectedAsset?.assetCode}. Redirecting to repairs...`);
        window.setTimeout(() => {
          router.push("/repairs");
          router.refresh();
        }, 900);
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Failed to submit repair");
      }
    });
  }

  function resetRepairForm() {
    setError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    setForm((current) => ({
      ...current,
      assetId: "",
      faultDescription: "",
      repairTypeCategory: "HARDWARE",
      repairTypeOther: "",
      repairStage: "CHECKED",
      stageDate: current.reportedDate || toDateTimeInputValue(),
      repairDetails: "",
      handledBy: "",
      remarks: "",
      repairDocumentName: ""
    }));
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
    >
      <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--nav)]">Repair Source / Asset Scope</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Choose how the asset should be located before you create the repair record.
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
              onClick={() => updateScope(scope.value)}
              className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                form.repairScope === scope.value
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

      {form.repairScope === "WORKSTATION_DEVICE" ? (
        <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--nav)]">Workstation Device Selection</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Select Flow</span>
              <select
                value={form.repairFlow}
                onChange={(event) => onFlowChange(event.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="">Select flow</option>
                <option value="Ground">Ground</option>
                <option value="1st Flow">1st Flow</option>
                <option value="2nd Flow">2nd Flow</option>
                <option value="3rd Flow">3rd Flow</option>
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Select Workstation</span>
              {flowWorkstations.length > 0 ? (
                <select
                  value={form.workstationId}
                  onChange={(event) => onWorkstationChange(event.target.value)}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <option value="">Select workstation</option>
                  {flowWorkstations.map((workstation) => (
                    <option key={workstation.id} value={workstation.id}>
                      {workstation.code} - {workstation.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                  {form.repairFlow
                    ? "Workstation mapping is not available for this flow yet."
                    : "Select a flow first to continue."}
                </div>
              )}
            </label>
          </div>

          {canShowAssetPicker ? (
            <div className="mt-4 space-y-4">
              <label className="grid gap-2 text-sm md:max-w-xs">
                <span className="font-medium">Device Type Filter</span>
                <select
                  value={form.deviceTypeFilter}
                  onChange={(event) => updateField("deviceTypeFilter", event.target.value)}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  <option value="">All Device Types</option>
                  {["Machine", "Monitor", "Keyboard", "Mouse", "UPS", "Phone", "Tab"].map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-3">
                {filteredWorkstationAssets.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => onAssetChange(asset.id)}
                    className={`grid w-full gap-3 rounded-[1.35rem] border px-4 py-4 text-left transition md:grid-cols-[1.1fr_0.8fr_0.5fr_1fr] ${
                      form.assetId === asset.id
                        ? "border-[var(--nav)] bg-[var(--panel-strong)] shadow-sm"
                        : "border-[var(--border)] bg-white hover:bg-[var(--panel-strong)]"
                    }`}
                  >
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Inventory Code</p>
                      <p className="mt-1 text-sm font-semibold text-[var(--nav)]">{asset.assetCode}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Device Type</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">{asset.assetType === "Tablet" ? "Tab" : asset.assetType}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Side</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">{asset.side ?? "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Brand / Model</p>
                      <p className="mt-1 text-sm font-medium text-[var(--text)]">
                        {asset.brand} / {asset.model}
                      </p>
                    </div>
                  </button>
                ))}

                {filteredWorkstationAssets.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                    No assigned assets match this workstation and filter.
                  </div>
                ) : null}
              </div>
            </div>
            ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
              Select a workstation to load its assigned inventory assets.
            </div>
          )}
        </section>
      ) : null}

      {form.repairScope === "OTHER_DEVICE" ? (
        <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--nav)]">Other Inventory Asset Selection</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Filters apply automatically as you select a type, location, or search term.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Asset Type filter</span>
              <select
                value={form.otherAssetTypeFilter}
                onChange={(event) => updateField("otherAssetTypeFilter", event.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="">All Asset Types</option>
                {["Machine", "Monitor", "Keyboard", "Mouse", "UPS", "Phone", "Tab", "TV", "AC"].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">General Location filter</span>
              <select
                value={form.otherLocationFilter}
                onChange={(event) => updateField("otherLocationFilter", event.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="">All Locations</option>
                {[
                  "Ground Floor",
                  "1st Flow",
                  "2nd Flow",
                  "3rd Flow",
                  "Admin Office",
                  "Meeting Room",
                  "Reception",
                  "Store",
                  "Main Store"
                ].map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Search</span>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-[var(--muted)]">
                  <SearchIcon />
                </span>
                <input
                  value={form.otherSearch}
                  onChange={(event) => updateField("otherSearch", event.target.value)}
                  placeholder="Code, serial, brand, or model"
                  className="w-full rounded-2xl border border-[var(--border)] bg-white py-3 pl-11 pr-4"
                />
              </div>
            </label>
          </div>

          <div className="mt-4 space-y-3">
            {filteredOtherAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => onAssetChange(asset.id)}
                className={`grid w-full gap-3 rounded-[1.35rem] border px-4 py-4 text-left transition md:grid-cols-[1.1fr_0.8fr_0.9fr_1fr] ${
                  form.assetId === asset.id
                    ? "border-[var(--nav)] bg-[var(--panel-strong)] shadow-sm"
                    : "border-[var(--border)] bg-white hover:bg-[var(--panel-strong)]"
                }`}
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Inventory Code</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--nav)]">{asset.assetCode}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Device Type</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{asset.assetType === "Tablet" ? "Tab" : asset.assetType}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">General Location</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">{asset.currentLocation ?? "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Brand / Model</p>
                  <p className="mt-1 text-sm font-medium text-[var(--text)]">
                    {asset.brand} / {asset.model}
                  </p>
                </div>
              </button>
            ))}

            {filteredOtherAssets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                No non-workstation inventory assets match the current filters.
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {selectedAsset ? (
        <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--muted)]">
          <span className="font-medium text-[var(--text)]">Selected Asset:</span>{" "}
          {selectedAsset.assetCode} / {selectedAsset.assetType} / {selectedAsset.serialNumber}
          {selectedAsset.currentWorkstationCode ? ` / ${selectedAsset.currentWorkstationCode}` : ""}
          {!selectedAsset.currentWorkstationCode && selectedAsset.currentLocation ? ` / ${selectedAsset.currentLocation}` : ""}
        </div>
      ) : null}

      {selectedAsset ? (
        <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--nav)]">Selected Asset Details</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Existing inventory details from the selected asset record.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Inventory Type</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.assetType === "Tablet" ? "Tab" : selectedAsset.assetType}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Inventory Code</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.assetCode}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Serial Number</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.serialNumber}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Brand</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.brand}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Model</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.model}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Purchase Date</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{formatDate(selectedAsset.purchaseDate)}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Warranty Expiry Date</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.warrantyExpiryDate ?? "-"}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Status</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.status.replaceAll("_", " ")}</p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Asset Scope</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                {selectedAsset.assetScope ?? (selectedAsset.isWorkstationDevice ? "Workstation Device" : "Other / Non-Workstation Device")}
              </p>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 md:col-span-2 xl:col-span-3">
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Current Assignment / Location</p>
              <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                {selectedAsset.currentWorkstationCode ?? selectedAsset.currentLocation ?? "-"}
              </p>
            </div>

            {selectedAsset.isWorkstationDevice ? (
              <>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Flow</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.flow ?? "-"}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Workstation</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.currentWorkstationCode ?? "-"}</p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Side</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.side ?? "-"}</p>
                </div>
              </>
            ) : (
              <>
                <div className="rounded-2xl bg-white px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">General Location</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                    {selectedAsset.generalLocation ?? selectedAsset.currentLocation ?? "-"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white px-4 py-3 md:col-span-2">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--muted)]">Specific Location / Notes</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--text)]">{selectedAsset.specificLocationNotes ?? "-"}</p>
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}

      {selectedAsset ? (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4 xl:col-span-3">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--nav)]">Repair Details</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Inventory fields are read-only. The fields below belong to this repair record.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Inventory Type</span>
              <input
                value={selectedAsset.assetType === "Tablet" ? "Tab" : selectedAsset.assetType}
                readOnly
                className="rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Inventory Code</span>
              <input
                value={selectedAsset.assetCode}
                readOnly
                className="rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Serial Number</span>
              <input
                value={selectedAsset.serialNumber}
                readOnly
                className="rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3"
              />
            </label>

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Repair Type</span>
              <select
                value={form.repairTypeCategory}
                onChange={(event) => updateField("repairTypeCategory", event.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="WARRANTY_CLAIM">Warranty Claim</option>
                <option value="TEMPORARY_REPLACEMENT">Temporary Replacement</option>
                <option value="SOFTWARE">Software</option>
                <option value="HARDWARE">Hardware</option>
                <option value="OTHER">Other</option>
              </select>
              {fieldErrors.repairTypeCategory ? <span className="text-xs text-rose-700">{fieldErrors.repairTypeCategory}</span> : null}
            </label>

            {form.repairTypeCategory === "OTHER" ? (
              <label className="grid gap-2 text-sm">
                <span className="font-medium">Please specify</span>
                <input
                  value={form.repairTypeOther}
                  onChange={(event) => updateField("repairTypeOther", event.target.value)}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                />
                {fieldErrors.repairTypeOther ? <span className="text-xs text-rose-700">{fieldErrors.repairTypeOther}</span> : null}
              </label>
            ) : (
              <div />
            )}

            <label className="grid gap-2 text-sm">
              <span className="font-medium">Repair Stage</span>
              <select
                value={form.repairStage}
                onChange={(event) => updateField("repairStage", event.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="CHECKED">Checked</option>
                <option value="SENT_FOR_REPAIR">Sent for Repair</option>
                <option value="REPAIR_CARRIED_OUT">Repair Carried Out</option>
                <option value="RETURNED">Returned</option>
              </select>
              {fieldErrors.repairStage ? <span className="text-xs text-rose-700">{fieldErrors.repairStage}</span> : null}
            </label>

            <label className="grid gap-2 text-sm xl:col-span-3">
              <span className="font-medium">Fault</span>
              <textarea
                value={form.faultDescription}
                onChange={(event) => updateField("faultDescription", event.target.value)}
                rows={3}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
              {fieldErrors.faultDescription ? <span className="text-xs text-rose-700">{fieldErrors.faultDescription}</span> : null}
            </label>
          </div>
        </section>
      </div>
      ) : null}

      {selectedAsset ? (
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Stage Date</span>
          <input
            type="date"
            value={form.stageDate ? form.stageDate.slice(0, 10) : ""}
            onChange={(event) => updateField("stageDate", event.target.value ? `${event.target.value}T09:00` : "")}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          {fieldErrors.stageDate ? <span className="text-xs text-rose-700">{fieldErrors.stageDate}</span> : null}
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Repaired By</span>
          <input
            value={form.handledBy}
            onChange={(event) => updateField("handledBy", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          {fieldErrors.handledBy ? <span className="text-xs text-rose-700">{fieldErrors.handledBy}</span> : null}
        </label>
        <label className="grid gap-2 text-sm md:col-span-2">
          <span className="font-medium">Repair Details</span>
          <textarea
            value={form.repairDetails}
            onChange={(event) => updateField("repairDetails", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          {fieldErrors.repairDetails ? <span className="text-xs text-rose-700">{fieldErrors.repairDetails}</span> : null}
        </label>
      </div>
      ) : null}

      {selectedAsset ? (
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Remarks</span>
          <textarea
            value={form.remarks}
            onChange={(event) => updateField("remarks", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Upload Repair Invoice / Document</span>
          <input
            type="file"
            onChange={(event) => onRepairDocumentChange(event.target.files?.[0] ?? null)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-[0.8rem] text-sm"
          />
          <span className="text-xs text-[var(--muted)]">
            {form.repairDocumentName ? `Selected: ${form.repairDocumentName}` : "Attach a repair invoice or support document if available."}
          </span>
          {fieldErrors.repairDocumentName ? <span className="text-xs text-rose-700">{fieldErrors.repairDocumentName}</span> : null}
        </label>
      </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}
      {successMessage ? (
        <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
      ) : null}
      {!selectedAsset && form.repairScope ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Select an existing inventory asset to activate the repair form.
        </div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={resetRepairForm}
          className="rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending || !selectedAsset}
          className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save Repair"}
        </button>
      </div>
    </form>
  );
}
