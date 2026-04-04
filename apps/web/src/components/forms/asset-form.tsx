"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAsset } from "@/lib/api";
import { AssetType } from "@/lib/types";

const flowWorkstations: Record<string, string[]> = {
  "1st Flow": ["WS-07", "WS-08", "WS-09", "WS-10", "WS-11", "WS-12"],
  "2nd Flow": ["WS-01", "WS-02", "WS-03", "WS-04", "WS-05", "WS-06"]
};

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

export function AssetForm({ assetTypes }: { assetTypes: AssetType[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const inventoryTypeOptions = [
    { label: "TV", id: assetTypes.find((type) => type.name === "TV")?.id ?? "" },
    { label: "Machine", id: assetTypes.find((type) => type.name === "Machine")?.id ?? "" },
    { label: "Monitor", id: assetTypes.find((type) => type.name === "Monitor")?.id ?? "" },
    { label: "AC", id: assetTypes.find((type) => type.name === "AC")?.id ?? "" },
    { label: "VGA Cable", id: assetTypes.find((type) => type.name === "VGA Cable")?.id ?? "" },
    { label: "Keyboard", id: assetTypes.find((type) => type.name === "Keyboard")?.id ?? "" },
    { label: "Mouse", id: assetTypes.find((type) => type.name === "Mouse")?.id ?? "" },
    { label: "UPS", id: assetTypes.find((type) => type.name === "UPS")?.id ?? "" },
    { label: "Phone", id: assetTypes.find((type) => type.name === "Phone")?.id ?? "" },
    { label: "Tab", id: assetTypes.find((type) => type.name === "Tablet")?.id ?? "" }
  ].filter((option) => option.id);

  const [form, setForm] = useState({
    assetCode: "",
    assetTypeId: inventoryTypeOptions[0]?.id ?? assetTypes[0]?.id ?? "",
    brand: "",
    model: "",
    serialNumber: "",
    purchaseDate: "",
    warrantyExpiryDate: "",
    status: "IN_STORE",
    assetScope: "Workstation Device",
    assignmentFlow: "",
    workstationCode: "",
    assignmentSide: "",
    generalLocation: "",
    specificLocationNotes: "",
    invoiceFileName: ""
  });

  const isActive = form.status === "ACTIVE";
  const isWorkstationScope = form.assetScope === "Workstation Device";
  const availableWorkstations = flowWorkstations[form.assignmentFlow] ?? [];
  const sideApplicable =
    isActive &&
    (isWorkstationScope
      ? Boolean(form.workstationCode) || (availableWorkstations.length === 0 && Boolean(form.assignmentFlow))
      : Boolean(form.generalLocation));

  const shouldShowAssignmentSummary =
    isActive &&
    (isWorkstationScope
      ? Boolean(form.assignmentFlow && (form.workstationCode || !availableWorkstations.length))
      : Boolean(form.generalLocation));

  const assignmentSummaryParts = [
    isWorkstationScope ? form.assignmentFlow || null : form.generalLocation || null,
    isWorkstationScope
      ? form.workstationCode || (!availableWorkstations.length && form.assignmentFlow ? "Workstation area" : null)
      : form.specificLocationNotes || null,
    sideApplicable ? form.assignmentSide || null : null
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

  function updateStatus(value: string) {
    clearFieldError("status");
    setForm((current) => ({
      ...current,
      status: value,
      assetScope: "Workstation Device",
      assignmentFlow: "",
      workstationCode: "",
      assignmentSide: "",
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
      assignmentSide: ""
    }));
  }

  function onInvoiceChange(file: File | null) {
    if (!file) {
      clearFieldError("invoiceFileName");
      updateField("invoiceFileName", "");
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

    setError(null);
    clearFieldError("invoiceFileName");
    updateField("invoiceFileName", file.name);
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
      if (!form.assetScope) nextErrors.assetScope = "Please select an asset scope.";

      if (isWorkstationScope) {
        if (!form.assignmentFlow) nextErrors.assignmentFlow = "Please select a flow.";
        if (availableWorkstations.length > 0 && !form.workstationCode) {
          nextErrors.workstationCode = "Please select a workstation.";
        }
        if (sideApplicable && !form.assignmentSide) {
          nextErrors.assignmentSide = "Please select a side.";
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
        const detailNotes = [
          form.warrantyExpiryDate ? `Warranty Expiry Date: ${form.warrantyExpiryDate}` : null,
          form.invoiceFileName ? `Attached Invoice: ${form.invoiceFileName}` : null,
          isActive ? `Asset Scope: ${form.assetScope}` : null,
          isActive && isWorkstationScope && form.assignmentFlow ? `Flow: ${form.assignmentFlow}` : null,
          isActive && isWorkstationScope && form.workstationCode ? `Assigned Workstation: ${form.workstationCode}` : null,
          isActive && !isWorkstationScope && form.generalLocation ? `General Location: ${form.generalLocation}` : null,
          isActive && !isWorkstationScope && form.specificLocationNotes
            ? `Specific Location / Notes: ${form.specificLocationNotes}`
            : null,
          isActive && sideApplicable && form.assignmentSide ? `Side: ${form.assignmentSide}` : null
        ]
          .filter(Boolean)
          .join(" | ");

        const resolvedLocation = isActive
          ? isWorkstationScope
            ? form.workstationCode || form.assignmentFlow || "Office Floor"
            : form.specificLocationNotes || form.generalLocation || "Office Floor"
          : "Main Store";

        await createAsset({
          ...form,
          purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
          currentLocation: resolvedLocation,
          specification: detailNotes || null,
          notes: detailNotes || null
        });

        setSuccessMessage("Inventory saved successfully. Redirecting to assets...");
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
              onChange={(e) => updateField("assetTypeId", e.target.value)}
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
              PDF only{form.invoiceFileName ? ` - selected: ${form.invoiceFileName}` : ""}
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
                      ? "Assign this item by flow, workstation, and side."
                      : "Assign this item to a general office location."}
                  </p>
                </button>
              ))}
            </div>
            {fieldErrors.assetScope ? <span className="mt-2 block text-xs text-rose-700">{fieldErrors.assetScope}</span> : null}
          </div>

          {isWorkstationScope ? (
            <>
              <div className="mt-5">
                <p className="text-sm font-medium text-[var(--text)]">Flow</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {["Ground", "1st Flow", "2nd Flow", "3rd Flow"].map((flow) => (
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
                        {availableWorkstations.map((code) => (
                          <button
                            key={code}
                            type="button"
                            onClick={() => updateField("workstationCode", code)}
                            className={`rounded-[1.2rem] border px-4 py-3 text-sm font-semibold transition ${
                              form.workstationCode === code
                                ? "border-[var(--nav)] bg-[var(--panel-strong)] text-[var(--nav)] shadow-sm"
                                : "border-[var(--border)] bg-white text-[var(--text)] hover:bg-[var(--panel-strong)]"
                            }`}
                          >
                            {code}
                          </button>
                        ))}
                      </div>
                      {fieldErrors.workstationCode ? <span className="mt-2 block text-xs text-rose-700">{fieldErrors.workstationCode}</span> : null}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white px-4 py-4 text-sm text-[var(--muted)]">
                      Workstation selection is not required for this flow right now.
                    </div>
                  )}
                </div>
              ) : null}

              {sideApplicable ? (
                <div>
                  <p className="text-sm font-medium text-[var(--text)]">Side</p>
                  <div className="mt-3 inline-flex rounded-full border border-[var(--border)] bg-white p-1">
                    {["Left", "Right"].map((side) => (
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
            </>
          ) : (
            <div className="mt-5 rounded-[1.4rem] border border-[var(--border)] bg-white/75 p-4">
              <div className="mb-4">
                <p className="text-sm font-semibold text-[var(--nav)]">Other / Non-Workstation Device Location</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Use this for shared devices or assets placed outside workstation assignments.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span className="font-medium">General Location</span>
                  <select
                    value={form.generalLocation}
                    onChange={(e) => updateField("generalLocation", e.target.value)}
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  >
                    <option value="">Select general location</option>
                    {generalLocationOptions.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                  {fieldErrors.generalLocation ? <span className="text-xs text-rose-700">{fieldErrors.generalLocation}</span> : null}
                </label>

                <label className="grid gap-2 text-sm">
                  <span className="font-medium">Specific Location / Notes</span>
                  <input
                    value={form.specificLocationNotes}
                    onChange={(e) => updateField("specificLocationNotes", e.target.value)}
                    placeholder="Example: AC in Meeting Room or TV in Reception"
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  />
                </label>
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
          {isPending ? "Saving..." : "Save Inventory"}
        </button>
      </div>
    </form>
  );
}
