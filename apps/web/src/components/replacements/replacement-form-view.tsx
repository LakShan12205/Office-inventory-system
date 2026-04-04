"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReplacementForm } from "@/components/forms/replacement-form";
import { createReplacement } from "@/lib/api";
import { AssetRecord, ReplacementRecord } from "@/lib/types";

type FlowCode = "Flow-01" | "Flow-02";

export type ReplacementInitialContext = {
  originalAssetId?: string | null;
  originalAssetCode?: string | null;
  workstationCode?: string | null;
  flowCode?: FlowCode | null;
  reason?: "Due to ongoing repair" | "Not working" | "Other" | null;
};

function toReasonValue(value: string) {
  if (value === "Due to ongoing repair") return "DUE_TO_ONGOING_REPAIR";
  if (value === "Not working") return "NOT_WORKING";
  return "OTHER";
}

function getOperationalStatus(replacement: ReplacementRecord) {
  const expected = replacement.repair?.expectedReturnDate;
  if (replacement.isReturned) return "RETURNED";
  if (expected && new Date(expected) < new Date()) return "OVERDUE";
  return "ACTIVE";
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

function assetScopeLabel(asset: AssetRecord) {
  return asset.assetScope ?? (asset.workstationAssignments.some((assignment) => assignment.isActive) ? "Workstation Device" : "Other / Non-Workstation Device");
}

function workstationCodeForAsset(asset: AssetRecord) {
  return asset.workstationCode ?? asset.workstationAssignments.find((assignment) => assignment.isActive)?.workstation.code ?? "";
}

export function ReplacementFormView({
  replacements,
  assets,
  initialContext
}: {
  replacements: ReplacementRecord[];
  assets: AssetRecord[];
  initialContext?: ReplacementInitialContext;
}) {
  const router = useRouter();
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [submissionState, setSubmissionState] = useState<{
    type: "success" | "error";
    title: string;
    description: string;
  } | null>(null);

  const inventoryCandidates = useMemo(
    () => assets.filter((asset) => asset.status !== "RETIRED"),
    [assets]
  );

  const selectedOriginalAsset =
    inventoryCandidates.find((asset) => asset.id === initialContext?.originalAssetId) ??
    inventoryCandidates.find((asset) => asset.assetCode === initialContext?.originalAssetCode) ??
    inventoryCandidates.find((asset) => asset.workstationCode === initialContext?.workstationCode) ??
    null;

  const selectedReplacement =
    replacements.find((item) => item.originalAsset.id === selectedOriginalAsset?.id) ??
    replacements.find((item) => item.originalAsset.assetCode === selectedOriginalAsset?.assetCode) ??
    null;

  const [draft, setDraft] = useState({
    flowCode:
      initialContext?.flowCode ??
      (selectedOriginalAsset?.flow as FlowCode) ??
      "Flow-02",
    workstationCode:
      initialContext?.workstationCode ??
      selectedOriginalAsset?.workstationCode ??
      "WS-01",
    deviceType: selectedOriginalAsset?.assetType.name ?? "Machine",
    originalAssetCode: selectedOriginalAsset?.assetCode ?? "",
    location: selectedOriginalAsset ? assetLocationLabel(selectedOriginalAsset) : "Not recorded",
    replacementAssetCode: "",
    replacementType: "Temporary" as "Temporary" | "Permanent",
    replacementDate: new Date().toISOString().slice(0, 10),
    reason: initialContext?.reason ?? "Due to ongoing repair",
    customReason: ""
  });

  const contextOptions = useMemo(() => {
    const activeReplacementCodes = new Set(
      replacements
        .filter((item) => !item.isReturned && getOperationalStatus(item) !== "RETURNED")
        .map((item) => item.replacementAsset.assetCode)
    );

    const replacementAssets = inventoryCandidates
      .filter((asset) => asset.assetType.name === draft.deviceType)
      .filter((asset) => asset.assetCode !== selectedOriginalAsset?.assetCode)
      .filter((asset) => asset.status === "IN_STORE")
      .filter((asset) => !asset.workstationAssignments.some((assignment) => assignment.isActive))
      .filter((asset) => !activeReplacementCodes.has(asset.assetCode));

    return replacementAssets.map((item) => ({
      value: item.assetCode,
      label: `${item.assetCode} | ${item.brand} ${item.model} | ${assetLocationLabel(item)}`,
      inventoryCode: item.assetCode,
      brandModel: `${item.brand} / ${item.model}`,
      location: assetLocationLabel(item),
      status: item.status.replaceAll("_", " ")
    }));
  }, [draft.deviceType, inventoryCandidates, replacements, selectedOriginalAsset?.assetCode]);

  function updateDraft(name: keyof typeof draft, value: string) {
    setSubmissionState(null);
    setFormErrors((current) => {
      if (!current[name] && !(name === "originalAssetCode" && current.originalDevice)) return current;
      const next = { ...current };
      delete next[name];
      if (name === "originalAssetCode") delete next.originalDevice;
      return next;
    });

    setDraft((current) => ({
      ...current,
      [name]: name === "reason" && value !== "Other" ? value : value,
      customReason: name === "reason" && value !== "Other" ? "" : current.customReason
    }));
  }

  const resolvedDraft = {
    ...draft,
    originalAssetCode: selectedOriginalAsset?.assetCode ?? draft.originalAssetCode,
    deviceType: selectedOriginalAsset?.assetType.name ?? draft.deviceType,
    workstationCode: selectedOriginalAsset ? workstationCodeForAsset(selectedOriginalAsset) || draft.workstationCode : draft.workstationCode,
    flowCode:
      selectedOriginalAsset?.flow
        ? (selectedOriginalAsset.flow as FlowCode)
        : selectedOriginalAsset && workstationCodeForAsset(selectedOriginalAsset)
          ? getFlowCodeFromWorkstationCode(workstationCodeForAsset(selectedOriginalAsset))
          : draft.flowCode,
    location: selectedOriginalAsset ? assetLocationLabel(selectedOriginalAsset) : draft.location
  };

  function validateReplacementForm() {
    const nextErrors: Record<string, string> = {};

    if (!selectedOriginalAsset) {
      nextErrors.originalDevice = "Select the original damaged device first.";
    }
    if (!resolvedDraft.originalAssetCode.trim()) {
      nextErrors.originalAssetCode = "Inventory code is required from the selected device.";
    }
    if (!selectedOriginalAsset?.serialNumber?.trim()) {
      nextErrors.serialNumber = "Serial number is required from the selected device.";
    }
    if (!resolvedDraft.deviceType.trim()) {
      nextErrors.deviceType = "Inventory type is required from the selected device.";
    }
    if (!resolvedDraft.replacementType) {
      nextErrors.replacementType = "Please select a replacement type.";
    }
    if (!resolvedDraft.replacementAssetCode) {
      nextErrors.replacementAssetCode = "Please select a replacement asset.";
    }
    if (!resolvedDraft.replacementDate) {
      nextErrors.replacementDate = "Replacement date is required.";
    }
    if (!resolvedDraft.reason) {
      nextErrors.reason = "Please select a reason.";
    }
    if (resolvedDraft.reason === "Other" && !resolvedDraft.customReason.trim()) {
      nextErrors.customReason = "Please enter the custom reason.";
    }

    const eligibleReplacement = contextOptions.find(
      (asset) => asset.value === resolvedDraft.replacementAssetCode
    );
    if (resolvedDraft.replacementAssetCode && !eligibleReplacement) {
      nextErrors.replacementAssetCode =
        "Select an eligible replacement asset from available inventory.";
    }

    setFormErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function saveDemoChanges() {
    if (isSaving) {
      return;
    }

    if (!validateReplacementForm() || !selectedOriginalAsset) {
      return;
    }

    setIsSaving(true);
    setSubmissionState(null);

    try {
      const replacementAsset = inventoryCandidates.find(
        (asset) => asset.assetCode === resolvedDraft.replacementAssetCode
      );
      const activeAssignment =
        selectedOriginalAsset.workstationAssignments.find((assignment) => assignment.isActive) ?? null;

      if (!replacementAsset) {
        throw new Error("Selected replacement asset is no longer available.");
      }

      await createReplacement({
        originalAssetId: selectedOriginalAsset.id,
        replacementAssetId: replacementAsset.id,
        replacementType: resolvedDraft.replacementType === "Permanent" ? "PERMANENT" : "TEMPORARY",
        replacementDate: new Date(`${resolvedDraft.replacementDate}T09:00:00`).toISOString(),
        reason: toReasonValue(resolvedDraft.reason) as "DUE_TO_ONGOING_REPAIR" | "NOT_WORKING" | "OTHER",
        customReason: resolvedDraft.reason === "Other" ? resolvedDraft.customReason : null,
        workstationId: activeAssignment?.workstation.id ?? null
      });

      setSubmissionState({
        type: "success",
        title: "Replacement created successfully.",
        description: "The replacement asset has been assigned."
      });
    } catch {
      setSubmissionState({
        type: "error",
        title: "Failed to create replacement. Please try again.",
        description: "Your form data is still here, so you can review it and submit again."
      });
    } finally {
      setIsSaving(false);
    }
  }

  if (!selectedOriginalAsset) {
    return (
      <div className="rounded-[1.75rem] border border-dashed border-[var(--border)] bg-white px-5 py-10 text-center text-sm text-[var(--muted)] shadow-sm">
        Select an original device from the replacement selection page before opening the replacement form.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ReplacementForm
        values={resolvedDraft}
        replacementAssetOptions={contextOptions}
        fieldErrors={formErrors}
        submissionState={submissionState}
        isSaving={isSaving}
        onChange={updateDraft}
        onSave={saveDemoChanges}
        onCancel={() => router.push("/replacements")}
        onBackToSelection={() => router.push("/replacements")}
        onViewReplacements={() => router.push("/replacements?status=active")}
        onCreateAnotherReplacement={() => router.push("/replacements")}
        selectedOriginalAsset={selectedOriginalAsset}
      />
    </div>
  );
}
