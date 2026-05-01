"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReplacementForm } from "@/components/forms/replacement-form";
import { createReplacement } from "@/lib/api";
import {
  FlowCode,
  getAssetFlowCode,
  getAssetLocationLabel,
  getAssignmentWorkstationCode,
  getAssignmentWorkstationId,
} from "@/lib/asset-mapping";
import { AssetRecord } from "@/lib/types";

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

function hasActiveAssignment(asset: AssetRecord) {
  return asset.workstationAssignments.some(
    (assignment) =>
      assignment.isActive || (assignment as { status?: string | null }).status === "ACTIVE"
  );
}

function isAcAsset(asset: AssetRecord) {
  return asset.assetType.name === "AC";
}

export function ReplacementFormView({
  assets,
  initialContext
}: {
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
    () => assets.filter((asset) => asset.status !== "RETIRED" && !isAcAsset(asset)),
    [assets]
  );

  const selectedOriginalAsset =
    inventoryCandidates.find((asset) => asset.id === initialContext?.originalAssetId) ??
    inventoryCandidates.find((asset) => asset.assetCode === initialContext?.originalAssetCode) ??
    inventoryCandidates.find((asset) => asset.workstationCode === initialContext?.workstationCode) ??
    null;

  const [draft, setDraft] = useState({
    flowCode:
      initialContext?.flowCode ??
      (selectedOriginalAsset ? getAssetFlowCode(selectedOriginalAsset) : null) ??
      "Flow-02",
    workstationCode:
      initialContext?.workstationCode ??
      (selectedOriginalAsset ? getAssignmentWorkstationCode(selectedOriginalAsset) : null) ??
      "WS-01",
    deviceType: selectedOriginalAsset?.assetType.name ?? "Machine",
    originalAssetCode: selectedOriginalAsset?.assetCode ?? "",
    location: selectedOriginalAsset ? getAssetLocationLabel(selectedOriginalAsset) : "Not recorded",
    replacementAssetCode: "",
    replacementType: "Temporary" as "Temporary" | "Permanent",
    replacementDate: new Date().toISOString().slice(0, 10),
    reason: initialContext?.reason ?? "Due to ongoing repair",
    customReason: ""
  });

  const contextOptions = useMemo(() => {
    const replacementAssets = inventoryCandidates
      .filter((asset) => asset.assetType.name === draft.deviceType)
      .filter((asset) => asset.assetCode !== selectedOriginalAsset?.assetCode)
      // Use the live asset record as the source of truth for replacement eligibility.
      // If an asset is really available, it should be IN_STORE and have no active assignment.
      .filter((asset) => asset.status === "IN_STORE")
      .filter((asset) => !hasActiveAssignment(asset));

    return replacementAssets.map((item) => ({
      value: item.assetCode,
      label: `${item.assetCode} | ${item.brand} ${item.model} | ${getAssetLocationLabel(item)}`,
      inventoryCode: item.assetCode,
      brandModel: `${item.brand} / ${item.model}`,
      location: getAssetLocationLabel(item),
      status: item.status.replaceAll("_", " ")
    }));
  }, [draft.deviceType, inventoryCandidates, selectedOriginalAsset?.assetCode]);

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
    workstationCode: selectedOriginalAsset
      ? getAssignmentWorkstationCode(selectedOriginalAsset) || draft.workstationCode
      : draft.workstationCode,
    flowCode:
      selectedOriginalAsset ? getAssetFlowCode(selectedOriginalAsset) ?? draft.flowCode : draft.flowCode,
    location: selectedOriginalAsset ? getAssetLocationLabel(selectedOriginalAsset) : draft.location
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
      const activeWorkstationId = getAssignmentWorkstationId(selectedOriginalAsset);

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
        workstationId: activeWorkstationId
      });

      setSubmissionState({
        type: "success",
        title: "Replacement created successfully.",
        description: "The replacement asset has been assigned."
      });
    } catch (error) {
      const message =
        error instanceof Error && error.message.trim()
          ? error.message
          : "Failed to create replacement. Please try again.";
      setSubmissionState({
        type: "error",
        title: message,
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
