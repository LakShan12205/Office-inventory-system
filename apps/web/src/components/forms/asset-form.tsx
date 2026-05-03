"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAsset, updateAsset } from "@/lib/api";
import {
  getAssignmentWorkstationCode,
  getPlacementPositionOptions,
  getPlacementSideOptions
} from "@/lib/asset-mapping";
import { AssetRecord, AssetType, WorkstationListItem } from "@/lib/types";

const MAX_INVOICE_FILE_SIZE = 10 * 1024 * 1024;
const simTypeOptions = ["Physical SIM", "eSIM"] as const;
const networkProviderOptions = ["Mobitel", "Dialog", "Hutch", "Airtel"] as const;
const adapterTypeOptions = [
  "Laptop Charger",
  "Monitor Adapter",
  "TV Adapter",
  "Router Adapter",
  "Switch Adapter",
  "Phone Charger",
  "Tablet Charger",
  "CCTV Adapter",
  "Other"
] as const;

const generalLocationOptions = [
  "Ground Floor",
  "1st Flow",
  "2nd Flow",
  "3rd Flow",
  "Admin Office",
  "Meeting Room",
  "Reception",
  "Store"
];

function toDateInputValue(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

const acGeneralLocationOptions = [
  "1st Flow",
  "2nd Flow",
  "Meeting Room",
  "Reception",
  "Admin Office"
];

const workstationFlowOptions = ["Ground", "1st Flow", "2nd Flow", "3rd Flow"];
const forcedWorkstationFlowOptions = ["1st Flow", "2nd Flow"];

export function AssetForm({
  assetTypes,
  assets,
  workstations,
  initialAsset
}: {
  assetTypes: AssetType[];
  assets: AssetRecord[];
  workstations: WorkstationListItem[];
  initialAsset?: AssetRecord;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [selectedInvoiceFile, setSelectedInvoiceFile] = useState<File | null>(null);

  const inventoryTypeOptions = [
    { label: "TV", id: assetTypes.find((type) => type.name === "TV")?.id ?? "" },
    { label: "Machine", id: assetTypes.find((type) => type.name === "Machine")?.id ?? "" },
    { label: "Monitor", id: assetTypes.find((type) => type.name === "Monitor")?.id ?? "" },
    { label: "Adapter", id: assetTypes.find((type) => type.name === "Adapter")?.id ?? "" },
    { label: "SIM", id: assetTypes.find((type) => type.name === "SIM")?.id ?? "" },
    { label: "Chair", id: assetTypes.find((type) => type.name === "Chair")?.id ?? "" },
    { label: "Table", id: assetTypes.find((type) => type.name === "Table")?.id ?? "" },
    { label: "AC", id: assetTypes.find((type) => type.name === "AC")?.id ?? "" },
    { label: "VGA Cable", id: assetTypes.find((type) => type.name === "VGA Cable")?.id ?? "" },
    { label: "Keyboard", id: assetTypes.find((type) => type.name === "Keyboard")?.id ?? "" },
    { label: "Mouse", id: assetTypes.find((type) => type.name === "Mouse")?.id ?? "" },
    { label: "UPS", id: assetTypes.find((type) => type.name === "UPS")?.id ?? "" },
    { label: "Phone", id: assetTypes.find((type) => type.name === "Phone")?.id ?? "" },
    { label: "Tab", id: assetTypes.find((type) => type.name === "Tablet")?.id ?? "" }
  ].filter((option) => option.id);

  const [form, setForm] = useState(() => ({
    assetCode: initialAsset?.assetCode ?? "",
    assetTypeId: initialAsset?.assetType.id ?? inventoryTypeOptions[0]?.id ?? assetTypes[0]?.id ?? "",
    relatedAssetId: initialAsset?.relatedAssetId ?? "",
    brand: initialAsset?.brand ?? "",
    model: initialAsset?.model ?? "",
    serialNumber: initialAsset?.serialNumber ?? "",
    mobileNumber: initialAsset?.mobileNumber ?? "",
    networkProvider: initialAsset?.networkProvider ?? "",
    simType: initialAsset?.simType ?? "",
    adapterType: initialAsset?.adapterType ?? "",
    otherAdapterType: initialAsset?.otherAdapterType ?? "",
    purchaseDate: toDateInputValue(initialAsset?.purchaseDate),
    warrantyExpiryDate: toDateInputValue(initialAsset?.warrantyExpiryDate),
    status: initialAsset?.status ?? "IN_STORE",
    assetScope: initialAsset?.assetScope ?? "Workstation Device",
    assignmentFlow: initialAsset?.flow ?? "",
    workstationCode: initialAsset?.workstationCode ?? "",
    assignmentSide: initialAsset?.side ?? "",
    assignmentPosition: initialAsset?.position ?? "",
    generalLocation: initialAsset?.generalLocation ?? "",
    specificLocationNotes: initialAsset?.specificLocationNotes ?? "",
    invoiceFileName: initialAsset?.invoiceFileName ?? "",
    invoiceFileUrl: initialAsset?.invoiceFileUrl ?? "",
    invoiceFileType: initialAsset?.invoiceFileType ?? "",
    invoiceFileSize: initialAsset?.invoiceFileSize?.toString() ?? ""
  }));

  const isActive = form.status === "ACTIVE";
  const selectedAssetTypeName =
    assetTypes.find((type) => type.id === form.assetTypeId)?.name ?? null;
  const isAdapterAsset = selectedAssetTypeName === "Adapter";
  const isSimAsset = selectedAssetTypeName === "SIM";
  const isChairAsset = selectedAssetTypeName === "Chair";
  const isTableAsset = selectedAssetTypeName === "Table";
  const isAcAsset = selectedAssetTypeName === "AC";
  const forceWorkstationScope = isAdapterAsset || isSimAsset || isChairAsset || isTableAsset;
  const isWorkstationScope = forceWorkstationScope || (!isAcAsset && form.assetScope === "Workstation Device");
  const locationOptions = isAcAsset ? acGeneralLocationOptions : generalLocationOptions;
  const sideOptions = getPlacementSideOptions(selectedAssetTypeName);
  const positionOptions = getPlacementPositionOptions(selectedAssetTypeName);
  const flowOptions = forceWorkstationScope ? forcedWorkstationFlowOptions : workstationFlowOptions;
  const availableWorkstations = useMemo(
    () =>
      workstations.filter(
        (workstation) =>
          workstation.location === form.assignmentFlow &&
          workstation.status !== "INACTIVE"
      ),
    [form.assignmentFlow, workstations]
  );
  const relatedPhoneOptions = useMemo(
    () =>
      assets.filter((asset) => asset.id !== initialAsset?.id)
        .filter((asset) => asset.assetType.name === "Phone")
        .filter(
          (asset) =>
            asset.id === form.relatedAssetId ||
            getAssignmentWorkstationCode(asset) === form.workstationCode
        )
        .filter((asset) => asset.status === "ACTIVE")
        .map((asset) => ({
          id: asset.id,
          label: `${asset.assetCode} | ${asset.brand} ${asset.model}`
        })),
    [assets, form.relatedAssetId, form.workstationCode, initialAsset?.id]
  );
  const workstationTypeConflict = useMemo(() => {
    if (!isActive || !form.workstationCode || !(isChairAsset || isTableAsset)) {
      return null;
    }

    const conflicting = assets.find((asset) => {
      if (asset.id === initialAsset?.id) return false;
      if (asset.assetType.name !== selectedAssetTypeName) return false;
      if (asset.status !== "ACTIVE") return false;
      return getAssignmentWorkstationCode(asset) === form.workstationCode;
    });

    return conflicting
      ? `${form.workstationCode} already has an active ${selectedAssetTypeName}.`
      : null;
  }, [
    assets,
    form.workstationCode,
    initialAsset?.id,
    isActive,
    isChairAsset,
    isTableAsset,
    selectedAssetTypeName
  ]);
  const sideApplicable =
    isActive &&
    sideOptions.length > 0 &&
    (isWorkstationScope
      ? Boolean(form.workstationCode) || (availableWorkstations.length === 0 && Boolean(form.assignmentFlow))
      : Boolean(form.generalLocation));
  const positionApplicable =
    isActive &&
    isWorkstationScope &&
    positionOptions.length > 0 &&
    (Boolean(form.workstationCode) || (availableWorkstations.length === 0 && Boolean(form.assignmentFlow)));

  const shouldShowAssignmentSummary =
    isActive &&
    (isWorkstationScope
      ? Boolean(form.assignmentFlow && (form.workstationCode || !availableWorkstations.length))
      : Boolean(form.generalLocation));

  const assignmentSummaryParts = [
    isWorkstationScope ? form.assignmentFlow || null : form.generalLocation || null,
    isWorkstationScope
      ? form.workstationCode || (!availableWorkstations.length && form.assignmentFlow ? "Workstation area" : null)
      : null,
    sideApplicable ? form.assignmentSide || null : null,
    positionApplicable ? form.assignmentPosition || null : null
  ].filter(Boolean);

  function clearFieldError(name: string) {
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function updateField(name: string, value: string) {
    clearFieldError(name);
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateAssetType(assetTypeId: string) {
    clearFieldError("assetTypeId");
    const nextAssetTypeName =
      assetTypes.find((type) => type.id === assetTypeId)?.name ?? null;
    const nextIsAcAsset = nextAssetTypeName === "AC";
    const nextForceWorkstationScope = ["Adapter", "SIM", "Chair", "Table"].includes(
      nextAssetTypeName ?? ""
    );
    const nextIsSimAsset = nextAssetTypeName === "SIM";

    setForm((current) => ({
      ...current,
      assetTypeId,
      assetScope: nextIsAcAsset
        ? "Other / Non-Workstation Device"
        : nextForceWorkstationScope
          ? "Workstation Device"
          : current.assetScope,
      assignmentFlow: nextIsAcAsset ? "" : current.assignmentFlow,
      workstationCode: nextIsAcAsset ? "" : current.workstationCode,
      assignmentSide: nextIsAcAsset ? "" : current.assignmentSide,
      assignmentPosition: nextIsAcAsset ? "" : current.assignmentPosition,
      relatedAssetId: nextIsSimAsset ? current.relatedAssetId : "",
      mobileNumber: nextIsSimAsset ? current.mobileNumber : "",
      networkProvider: nextIsSimAsset ? current.networkProvider : "",
      simType: nextIsSimAsset ? current.simType : "",
      adapterType: nextAssetTypeName === "Adapter" ? current.adapterType : "",
      otherAdapterType: nextAssetTypeName === "Adapter" && current.adapterType === "Other" ? current.otherAdapterType : "",
      generalLocation:
        nextIsAcAsset && !acGeneralLocationOptions.includes(current.generalLocation)
          ? ""
          : current.generalLocation,
      specificLocationNotes: nextIsAcAsset ? "" : current.specificLocationNotes
    }));
  }

  function updateStatus(value: string) {
    clearFieldError("status");
    setForm((current) => ({
      ...current,
      status: value,
      assetScope: isAcAsset
        ? "Other / Non-Workstation Device"
        : forceWorkstationScope
          ? "Workstation Device"
          : "Workstation Device",
      assignmentFlow: "",
      workstationCode: "",
      assignmentSide: "",
      assignmentPosition: "",
      relatedAssetId: isSimAsset ? "" : current.relatedAssetId,
      adapterType: isAdapterAsset ? current.adapterType : "",
      otherAdapterType: isAdapterAsset && current.adapterType === "Other" ? current.otherAdapterType : "",
      generalLocation: "",
      specificLocationNotes: ""
    }));
  }

  function updateAssetScope(value: string) {
    clearFieldError("assetScope");
    setForm((current) => ({
      ...current,
      assetScope: value,
      assignmentFlow: "",
      workstationCode: "",
      assignmentSide: "",
      assignmentPosition: "",
      relatedAssetId: "",
      generalLocation: "",
      specificLocationNotes: ""
    }));
  }

  function updateFlow(flow: string) {
    clearFieldError("assignmentFlow");
    setForm((current) => ({
      ...current,
      assignmentFlow: flow,
      workstationCode: "",
      assignmentSide: "",
      assignmentPosition: "",
      relatedAssetId: ""
    }));
  }

  function onInvoiceChange(file: File | null) {
    if (!file) {
      clearFieldError("invoiceFileName");
      setSelectedInvoiceFile(null);
      setForm((current) => ({
        ...current,
        invoiceFileName: initialAsset?.invoiceFileName ?? "",
        invoiceFileUrl: initialAsset?.invoiceFileUrl ?? "",
        invoiceFileType: initialAsset?.invoiceFileType ?? "",
        invoiceFileSize: initialAsset?.invoiceFileSize?.toString() ?? ""
      }));
      return;
    }

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setFieldErrors((current) => ({
        ...current,
        invoiceFileName: "Attached invoice must be a PDF file."
      }));
      setError("Attached invoice must be a PDF file.");
      return;
    }

    if (file.size > MAX_INVOICE_FILE_SIZE) {
      setFieldErrors((current) => ({
        ...current,
        invoiceFileName: "Attached invoice must be 10MB or smaller."
      }));
      setError("Attached invoice must be 10MB or smaller.");
      return;
    }

    setError(null);
    clearFieldError("invoiceFileName");
    setSelectedInvoiceFile(file);
    setForm((current) => ({
      ...current,
      invoiceFileName: file.name,
      invoiceFileUrl: "",
      invoiceFileType: file.type,
      invoiceFileSize: String(file.size)
    }));
  }

  function validateForm() {
    const nextErrors: Record<string, string> = {};

    if (!form.assetTypeId) nextErrors.assetTypeId = "Please select an inventory type.";
    if (!form.assetCode.trim()) nextErrors.assetCode = "Inventory code is required.";
    if (!form.serialNumber.trim()) nextErrors.serialNumber = "Serial number is required.";
    if (!form.brand.trim()) nextErrors.brand = "Brand is required.";
    if (!form.model.trim()) nextErrors.model = "Model is required.";
    if (!form.purchaseDate) nextErrors.purchaseDate = "Purchase date is required.";
    if (!form.warrantyExpiryDate) nextErrors.warrantyExpiryDate = "Warranty expiry date is required.";
    if (!form.status) nextErrors.status = "Please select a status.";

    if (isActive) {
      if (!isAcAsset && !forceWorkstationScope && !form.assetScope) {
        nextErrors.assetScope = "Please select an asset scope.";
      }

      if (isWorkstationScope) {
        if (!form.assignmentFlow) nextErrors.assignmentFlow = "Please select a flow.";
        if (forceWorkstationScope && !form.workstationCode) {
          nextErrors.workstationCode = "Please select a workstation.";
        } else if (availableWorkstations.length > 0 && !form.workstationCode) {
          nextErrors.workstationCode = "Please select a workstation.";
        }
        if (forceWorkstationScope && form.assignmentFlow && availableWorkstations.length === 0) {
          nextErrors.assignmentFlow = "This asset type requires a workstation-enabled flow.";
        }
        if ((isAdapterAsset || sideApplicable) && !form.assignmentSide) {
          nextErrors.assignmentSide = "Please select a side.";
        }
        if (positionApplicable && !form.assignmentPosition) {
          nextErrors.assignmentPosition = "Please select a position.";
        }
        if (isSimAsset && !form.relatedAssetId) {
          nextErrors.relatedAssetId = "Please select the related phone.";
        }
        if (workstationTypeConflict) {
          nextErrors.workstationCode = workstationTypeConflict;
        }
      } else {
        if (!form.generalLocation) nextErrors.generalLocation = "Please select a general location.";
      }
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!validateForm()) {
      setError("Please complete the required fields.");
      return;
    }

    startTransition(async () => {
      try {
        const resolvedLocation = isActive
          ? isWorkstationScope
            ? form.workstationCode || form.assignmentFlow || "Office Floor"
            : form.generalLocation || "Office Floor"
          : "Main Store";

        const payload = {
          assetCode: form.assetCode.trim(),
          assetTypeId: form.assetTypeId,
          relatedAssetId: form.relatedAssetId || null,
          brand: form.brand.trim(),
          model: form.model.trim(),
          serialNumber: form.serialNumber.trim(),
          mobileNumber: form.mobileNumber.trim() || null,
          networkProvider: form.networkProvider.trim() || null,
          simType: form.simType.trim() || null,
          adapterType: form.adapterType.trim() || null,
          otherAdapterType:
            form.adapterType === "Other" ? form.otherAdapterType.trim() || null : null,
          purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
          warrantyExpiryDate: form.warrantyExpiryDate
            ? new Date(form.warrantyExpiryDate).toISOString()
            : null,
          status: form.status,
          assetScope: isActive
            ? isWorkstationScope
              ? "WORKSTATION_DEVICE"
              : "OTHER_NON_WORKSTATION_DEVICE"
            : null,
          currentLocation: resolvedLocation,
          invoiceFileName: form.invoiceFileName || null,
          invoiceFileUrl: form.invoiceFileUrl || null,
          invoiceFileType: form.invoiceFileType || null,
          invoiceFileSize: form.invoiceFileSize ? Number(form.invoiceFileSize) : null,
          assignment:
            isActive
              ? isWorkstationScope
                ? {
                    workstationCode: form.workstationCode || null,
                    generalLocation: form.workstationCode ? null : form.assignmentFlow || null,
                    side: form.assignmentSide || null,
                    position: form.assignmentPosition || null,
                    startDate: new Date().toISOString()
                  }
                : {
                    generalLocation: form.generalLocation || null,
                    specificLocationNotes: isAcAsset ? null : form.specificLocationNotes || null,
                    startDate: new Date().toISOString()
                  }
              : null,
          notes: null,
          specification: null
        };

        const formData = new FormData();
        formData.append("payload", JSON.stringify(payload));

        if (selectedInvoiceFile) {
          formData.append("invoice", selectedInvoiceFile);
        }

        console.log("selectedInvoiceFile before submit:", selectedInvoiceFile);
        console.log("FormData has invoice:", formData.has("invoice"));

        if (initialAsset?.id) {
          await updateAsset(initialAsset.id, formData);
        } else {
          await createAsset(formData);
        }

        setSuccessMessage(
          initialAsset?.id
            ? "Inventory updated successfully. Redirecting to assets..."
            : "Inventory saved successfully. Redirecting to assets..."
        );
        window.setTimeout(() => {
          router.push("/assets");
          router.refresh();
        }, 900);
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Failed to create asset");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
    >
      <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--nav)]">Basic Information</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Inventory Type</span>
            <select
              value={form.assetTypeId}
              onChange={(e) => updateAssetType(e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            >
              {inventoryTypeOptions.map((assetType) => (
                <option key={assetType.id} value={assetType.id}>
                  {assetType.label}
                </option>
              ))}
            </select>
            {fieldErrors.assetTypeId ? <span className="text-xs text-rose-700">{fieldErrors.assetTypeId}</span> : null}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Inventory Code</span>
            <input
              value={form.assetCode}
              onChange={(e) => updateField("assetCode", e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            />
            {fieldErrors.assetCode ? <span className="text-xs text-rose-700">{fieldErrors.assetCode}</span> : null}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Serial Number</span>
            <input
              value={form.serialNumber}
              onChange={(e) => updateField("serialNumber", e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            />
            {fieldErrors.serialNumber ? <span className="text-xs text-rose-700">{fieldErrors.serialNumber}</span> : null}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Brand</span>
            <input
              value={form.brand}
              onChange={(e) => updateField("brand", e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            />
            {fieldErrors.brand ? <span className="text-xs text-rose-700">{fieldErrors.brand}</span> : null}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Model</span>
            <input
              value={form.model}
              onChange={(e) => updateField("model", e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            />
            {fieldErrors.model ? <span className="text-xs text-rose-700">{fieldErrors.model}</span> : null}
          </label>

          {isAdapterAsset ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Adapter Type</span>
              <select
                value={form.adapterType}
                onChange={(e) => {
                  updateField("adapterType", e.target.value);
                  if (e.target.value !== "Other") {
                    updateField("otherAdapterType", "");
                  }
                }}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              >
                <option value="">Select adapter type</option>
                {adapterTypeOptions.map((adapterType) => (
                  <option key={adapterType} value={adapterType}>
                    {adapterType}
                  </option>
                ))}
              </select>
            </label>
          ) : null}

          {isAdapterAsset && form.adapterType === "Other" ? (
            <label className="grid gap-2 text-sm">
              <span className="font-medium">Other Adapter Type</span>
              <input
                value={form.otherAdapterType}
                onChange={(e) => updateField("otherAdapterType", e.target.value)}
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              />
            </label>
          ) : null}
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--nav)]">Purchase Information</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Purchase Date</span>
            <input
              type="date"
              value={form.purchaseDate}
              onChange={(e) => updateField("purchaseDate", e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            />
            {fieldErrors.purchaseDate ? <span className="text-xs text-rose-700">{fieldErrors.purchaseDate}</span> : null}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Warranty Expiry Date</span>
            <input
              type="date"
              value={form.warrantyExpiryDate}
              onChange={(e) => updateField("warrantyExpiryDate", e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            />
            {fieldErrors.warrantyExpiryDate ? <span className="text-xs text-rose-700">{fieldErrors.warrantyExpiryDate}</span> : null}
          </label>
        </div>
      </section>

      <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
        <div className="mb-4">
          <h2 className="text-base font-semibold text-[var(--nav)]">Status and File</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Status</span>
            <select
              value={form.status}
              onChange={(e) => updateStatus(e.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            >
              <option value="ACTIVE">Active</option>
              <option value="IN_STORE">In Store</option>
            </select>
            {fieldErrors.status ? <span className="text-xs text-rose-700">{fieldErrors.status}</span> : null}
          </label>

          <label className="grid gap-2 text-sm">
            <span className="font-medium">Attached Invoice</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => onInvoiceChange(e.target.files?.[0] ?? null)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-[0.8rem] text-sm"
            />
            <span className="text-xs text-[var(--muted)]">
              PDF only, max 10MB{form.invoiceFileName ? ` - selected: ${form.invoiceFileName}` : ""}
            </span>
            {fieldErrors.invoiceFileName ? <span className="text-xs text-rose-700">{fieldErrors.invoiceFileName}</span> : null}
          </label>
        </div>
      </section>

      {isActive ? (
        <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/60 p-4">
          <div className="mb-4">
            <h2 className="text-base font-semibold text-[var(--nav)]">Assignment Location</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Select where this inventory item is currently assigned.
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--text)]">Asset Scope</p>
            {isAcAsset ? (
              <div className="mt-3 rounded-[1.4rem] border border-[var(--nav)] bg-[var(--panel-strong)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--nav)]">Other / Non-Workstation Device</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  AC units are managed as shared location-based assets and are not assigned to workstations.
                </p>
              </div>
            ) : forceWorkstationScope ? (
              <div className="mt-3 rounded-[1.4rem] border border-[var(--nav)] bg-[var(--panel-strong)] px-4 py-4">
                <p className="text-sm font-semibold text-[var(--nav)]">Workstation Device</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  {isSimAsset
                    ? "SIM cards are linked through Flow, Workstation, and the related Phone."
                    : `${selectedAssetTypeName} assets are assigned directly to a workstation when active.`}
                </p>
              </div>
            ) : (
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                {["Workstation Device", "Other / Non-Workstation Device"].map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => updateAssetScope(scope)}
                    className={`rounded-[1.4rem] border px-4 py-4 text-left transition ${
                      form.assetScope === scope
                        ? "border-[var(--nav)] bg-[var(--panel-strong)]"
                        : "border-[var(--border)] bg-white hover:bg-[var(--panel-strong)]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--nav)]">{scope}</p>
                    <p className="mt-1 text-sm text-[var(--muted)]">
                      {scope === "Workstation Device"
                        ? "Assign this item by flow, workstation, and placement."
                        : "Assign this item to a general office location."}
                    </p>
                  </button>
                ))}
              </div>
            )}
            {!isAcAsset && fieldErrors.assetScope ? <span className="mt-2 block text-xs text-rose-700">{fieldErrors.assetScope}</span> : null}
          </div>

          {isWorkstationScope ? (
            <>
              <div className="mt-5">
                <p className="text-sm font-medium text-[var(--text)]">Flow</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {flowOptions.map((flow) => (
                    <button
                      key={flow}
                      type="button"
                      onClick={() => updateFlow(flow)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        form.assignmentFlow === flow
                          ? "border-[var(--nav)] bg-[var(--nav)] text-white shadow-sm"
                          : "border-[var(--border)] bg-white text-[var(--nav)] hover:bg-[var(--panel-strong)]"
                      }`}
                    >
                      {flow}
                    </button>
                  ))}
                </div>
                {fieldErrors.assignmentFlow ? <span className="mt-2 block text-xs text-rose-700">{fieldErrors.assignmentFlow}</span> : null}
              </div>

              {form.assignmentFlow ? (
                <div className="mt-4">
                  {availableWorkstations.length > 0 ? (
                    <div>
                      <p className="text-sm font-medium text-[var(--text)]">Workstation</p>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {availableWorkstations.map((workstation) => (
                          <button
                            key={workstation.id}
                            type="button"
                            onClick={() => updateField("workstationCode", workstation.code)}
                            className={`rounded-[1.2rem] border px-4 py-3 text-sm font-semibold transition ${
                              form.workstationCode === workstation.code
                                ? "border-[var(--nav)] bg-[var(--panel-strong)] text-[var(--nav)] shadow-sm"
                                : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--panel-strong)]"
                            }`}
                          >
                            {workstation.code}
                          </button>
                        ))}
                      </div>
                      {fieldErrors.workstationCode ? <span className="mt-2 block text-xs text-rose-700">{fieldErrors.workstationCode}</span> : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                      {forceWorkstationScope
                        ? "This asset type requires a workstation-enabled flow. Please select 1st Flow or 2nd Flow."
                        : "Workstation selection is not required for this flow right now."}
                    </div>
                  )}
                </div>
              ) : null}

              {sideApplicable ? (
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Side</p>
                  <div className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-white p-1">
                    {sideOptions.map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => updateField("assignmentSide", side)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          form.assignmentSide === side
                            ? "bg-[var(--nav)] text-white shadow-sm"
                            : "text-[var(--nav)] hover:bg-[var(--panel-strong)]"
                        }`}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.assignmentSide ? <span className="mt-2 block text-xs text-rose-700">{fieldErrors.assignmentSide}</span> : null}
                </div>
              ) : null}

              {positionApplicable ? (
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Position</p>
                  <div className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-white p-1">
                    {positionOptions.map((position) => (
                      <button
                        key={position}
                        type="button"
                        onClick={() => updateField("assignmentPosition", position)}
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          form.assignmentPosition === position
                            ? "bg-[var(--nav)] text-white shadow-sm"
                            : "text-[var(--nav)] hover:bg-[var(--panel-strong)]"
                        }`}
                      >
                        {position}
                      </button>
                    ))}
                  </div>
                  {fieldErrors.assignmentPosition ? <span className="mt-2 block text-xs text-rose-700">{fieldErrors.assignmentPosition}</span> : null}
                </div>
              ) : null}

              {isSimAsset && form.workstationCode ? (
                <div className="mt-5 rounded-[1.4rem] border border-[var(--border)] bg-white/75 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">Related Phone</span>
                      <select
                        value={form.relatedAssetId}
                        onChange={(e) => updateField("relatedAssetId", e.target.value)}
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                      >
                        <option value="">Select phone</option>
                        {relatedPhoneOptions.map((phone) => (
                          <option key={phone.id} value={phone.id}>
                            {phone.label}
                          </option>
                        ))}
                      </select>
                      {fieldErrors.relatedAssetId ? (
                        <span className="text-xs text-rose-700">{fieldErrors.relatedAssetId}</span>
                      ) : null}
                    </label>

                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                      {relatedPhoneOptions.length > 0
                        ? "Only active Phone assets assigned to this workstation are listed."
                        : "No active Phone asset is currently assigned to this workstation."}
                    </div>

                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">Mobile Number</span>
                      <input
                        value={form.mobileNumber}
                        onChange={(e) => updateField("mobileNumber", e.target.value)}
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                      />
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">Network Provider</span>
                      <select
                        value={form.networkProvider}
                        onChange={(e) => updateField("networkProvider", e.target.value)}
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                      >
                        <option value="">Select network provider</option>
                        {networkProviderOptions.map((provider) => (
                          <option key={provider} value={provider}>
                            {provider}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="grid gap-2 text-sm">
                      <span className="font-medium">SIM Type</span>
                      <select
                        value={form.simType}
                        onChange={(e) => updateField("simType", e.target.value)}
                        className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                      >
                        <option value="">Select SIM type</option>
                        {simTypeOptions.map((simType) => (
                          <option key={simType} value={simType}>
                            {simType}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-[var(--border)] bg-white/75 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-[var(--nav)]">Other / Non-Workstation Device Location</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Use this for shared devices or assets placed outside workstation assignments.
                </p>
              </div>

              <div className={`grid gap-4 ${isAcAsset ? "" : "md:grid-cols-2"}`}>
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">General Location</span>
                  <select
                    value={form.generalLocation}
                    onChange={(e) => updateField("generalLocation", e.target.value)}
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  >
                    <option value="">Select general location</option>
                    {locationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.generalLocation ? <span className="text-xs text-rose-700">{fieldErrors.generalLocation}</span> : null}
                </label>

                {!isAcAsset ? (
                  <label className="grid gap-2 text-sm">
                    <span className="font-medium">Specific Location / Notes</span>
                    <input
                      value={form.specificLocationNotes}
                      onChange={(e) => updateField("specificLocationNotes", e.target.value)}
                      placeholder="Example: TV in Reception"
                      className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                    />
                  </label>
                ) : null}
              </div>
            </div>
          )}

          {shouldShowAssignmentSummary ? (
            <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--muted)]">
              <span className="font-medium text-[var(--text)]">Selected Location:</span>{" "}
              {assignmentSummaryParts.join(" / ")}
            </div>
          ) : null}
        </section>
      ) : (
        <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/50 px-4 py-4 text-sm text-[var(--muted)]">
          This item will remain in store and is not assigned to a workstation.
        </div>
      )}

      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {successMessage ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div> : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push("/assets")}
          className="rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {isPending ? "Saving..." : initialAsset?.id ? "Update Inventory" : "Save Inventory"}
        </button>
      </div>
    </form>
  );
}
