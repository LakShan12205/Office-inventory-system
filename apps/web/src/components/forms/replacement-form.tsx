"use client";

import { useEffect, useMemo, useState } from "react";
import { AssetRecord } from "@/lib/types";

type FlowCode = "Flow-01" | "Flow-02";

type ReplacementFormValues = {
  flowCode: FlowCode;
  workstationCode: string;
  deviceType: string;
  originalAssetCode: string;
  location: string;
  replacementAssetCode: string;
  replacementType: "Temporary" | "Permanent";
  replacementDate: string;
  reason: string;
  customReason: string;
};

export function ReplacementForm({
  values,
  replacementAssetOptions,
  fieldErrors,
  submissionState,
  isSaving,
  onChange,
  onSave,
  onCancel,
  onBackToSelection,
  onViewReplacements,
  onCreateAnotherReplacement,
  selectedOriginalAsset
}: {
  values: ReplacementFormValues;
  replacementAssetOptions: Array<{
    value: string;
    label: string;
    inventoryCode: string;
    brandModel: string;
    location: string;
    status: string;
  }>;
  fieldErrors?: Partial<
    Record<keyof ReplacementFormValues | "originalDevice" | "originalAssetCode" | "serialNumber" | "deviceType", string>
  >;
  submissionState?: {
    type: "success" | "error";
    title: string;
    description: string;
  } | null;
  isSaving?: boolean;
  onChange: (name: keyof ReplacementFormValues, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onBackToSelection: () => void;
  onViewReplacements: () => void;
  onCreateAnotherReplacement: () => void;
  selectedOriginalAsset: AssetRecord;
}) {
  const isWorkstationDevice =
    selectedOriginalAsset.assetScope === "Workstation Device" ||
    selectedOriginalAsset.workstationAssignments.some((assignment) => assignment.isActive);
  const [showReplacementAssetOptions, setShowReplacementAssetOptions] = useState(false);
  const selectedReplacementAsset = useMemo(
    () =>
      replacementAssetOptions.find((asset) => asset.value === values.replacementAssetCode) ?? null,
    [replacementAssetOptions, values.replacementAssetCode]
  );

  useEffect(() => {
    if (values.replacementAssetCode) {
      setShowReplacementAssetOptions(false);
    }
  }, [values.replacementAssetCode]);

  const isSaveDisabled =
    Boolean(isSaving) ||
    !values.originalAssetCode.trim() ||
    !selectedOriginalAsset.serialNumber.trim() ||
    !values.deviceType.trim() ||
    !values.replacementAssetCode.trim() ||
    !values.replacementDate.trim() ||
    !values.reason.trim() ||
    (values.reason === "Other" && !values.customReason.trim());

  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      {submissionState ? (
        <div
          className={`mb-5 rounded-2xl border px-4 py-4 text-sm ${
            submissionState.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <p className="font-semibold">{submissionState.title}</p>
          <p className="mt-1">{submissionState.description}</p>
          {submissionState.type === "success" ? (
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onViewReplacements}
                className="rounded-2xl bg-[var(--nav)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#214067]"
              >
                View Replacements
              </button>
              <button
                type="button"
                onClick={onCreateAnotherReplacement}
                className="rounded-2xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100"
              >
                Create Another Replacement
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
            Replacement Form
          </p>
          <h3 className="mt-2 text-xl font-semibold text-[var(--nav)]">
            {values.originalAssetCode || "Selected Device"}
          </h3>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Choose the replacement asset from existing inventory, then complete the record details below.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Inventory Code</span>
          <input
            value={values.originalAssetCode}
            readOnly
            className="rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3"
          />
          {fieldErrors?.originalDevice ? <span className="text-xs text-rose-700">{fieldErrors.originalDevice}</span> : null}
          {fieldErrors?.originalAssetCode ? <span className="text-xs text-rose-700">{fieldErrors.originalAssetCode}</span> : null}
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Serial Number</span>
          <input
            value={selectedOriginalAsset.serialNumber}
            readOnly
            className="rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3"
          />
          {fieldErrors?.serialNumber ? <span className="text-xs text-rose-700">{fieldErrors.serialNumber}</span> : null}
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Inventory Type</span>
          <input
            value={values.deviceType}
            readOnly
            className="rounded-2xl border border-[var(--border)] bg-slate-50 px-4 py-3"
          />
          {fieldErrors?.deviceType ? <span className="text-xs text-rose-700">{fieldErrors.deviceType}</span> : null}
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Replacement Type</span>
          <select
            value={values.replacementType}
            onChange={(event) => onChange("replacementType", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="Temporary">Temporary</option>
            <option value="Permanent">Permanent</option>
          </select>
          {fieldErrors?.replacementType ? <span className="text-xs text-rose-700">{fieldErrors.replacementType}</span> : null}
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Replacement Asset</span>
          <button
            type="button"
            onClick={() => setShowReplacementAssetOptions((current) => !current)}
            className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
          >
            {selectedReplacementAsset ? "Change Replacement Asset" : "Choose Replacement Asset"}
          </button>
          <span className="text-xs text-[var(--muted)]">
            Only eligible in-store inventory assets of the same device type are shown here.
          </span>
          {selectedReplacementAsset ? (
            <div className="rounded-2xl border border-[var(--nav)] bg-[var(--panel-strong)] px-4 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                Selected Replacement Asset
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--nav)]">
                {selectedReplacementAsset.inventoryCode}
              </p>
              <p className="mt-1 text-sm text-[var(--text)]">
                {selectedReplacementAsset.brandModel}
              </p>
              <p className="mt-1 text-sm text-[var(--muted)]">
                {selectedReplacementAsset.location}
              </p>
            </div>
          ) : null}
          {showReplacementAssetOptions ? (
            <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-white p-2">
              {replacementAssetOptions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-slate-50 px-4 py-5 text-sm text-[var(--muted)]">
                  No eligible replacement assets available.
                </div>
              ) : (
                replacementAssetOptions.map((asset) => {
                  const isSelected = values.replacementAssetCode === asset.value;

                  return (
                    <button
                      key={asset.value}
                      type="button"
                      onClick={() => onChange("replacementAssetCode", asset.value)}
                      className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-[var(--nav)] bg-[var(--panel-strong)]"
                          : "border-transparent bg-white hover:border-[var(--border)] hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--nav)]">
                          {asset.inventoryCode}
                        </p>
                        <p className="mt-1 text-sm text-[var(--text)]">{asset.brandModel}</p>
                        <p className="mt-1 text-sm text-[var(--muted)]">{asset.location}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          ) : null}
          <div className="pt-1">
            <button
              type="button"
              onClick={onBackToSelection}
              className="inline-flex items-center rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--panel-strong)] hover:text-[var(--nav)]"
            >
              Change Selected Device
            </button>
          </div>
          {fieldErrors?.replacementAssetCode ? <span className="text-xs text-rose-700">{fieldErrors.replacementAssetCode}</span> : null}
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Replacement Date</span>
          <input
            type="date"
            value={values.replacementDate}
            onChange={(event) => onChange("replacementDate", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
          {fieldErrors?.replacementDate ? <span className="text-xs text-rose-700">{fieldErrors.replacementDate}</span> : null}
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Reason</span>
          <select
            value={values.reason}
            onChange={(event) => onChange("reason", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="Due to ongoing repair">Due to ongoing repair</option>
            <option value="Not working">Not working</option>
            <option value="Other">Other</option>
          </select>
          {fieldErrors?.reason ? <span className="text-xs text-rose-700">{fieldErrors.reason}</span> : null}
        </label>

        {values.reason === "Other" ? (
          <label className="grid gap-2 text-sm">
            <span className="font-medium">Custom Reason</span>
            <input
              value={values.customReason}
              onChange={(event) => onChange("customReason", event.target.value)}
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            />
            {fieldErrors?.customReason ? <span className="text-xs text-rose-700">{fieldErrors.customReason}</span> : null}
          </label>
        ) : null}

        <div className="rounded-2xl border border-[var(--border)] bg-slate-50/70 p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
            Replacement Target Location
          </p>
          <p className="mt-2 font-semibold text-[var(--text)]">{values.location}</p>
          {isWorkstationDevice ? (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {values.flowCode} / {values.workstationCode}
              {selectedOriginalAsset.side ? ` / ${selectedOriginalAsset.side}` : ""}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--muted)]">
              {selectedOriginalAsset.generalLocation ?? values.location}
              {selectedOriginalAsset.specificLocationNotes
                ? ` / ${selectedOriginalAsset.specificLocationNotes}`
                : ""}
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-[var(--border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaveDisabled}
          className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#214067] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save Replacement"}
        </button>
      </div>
    </div>
  );
}
