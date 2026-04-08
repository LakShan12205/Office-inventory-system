import { AssetRecord } from "@/lib/types";

export type FlowCode = "Flow-01" | "Flow-02";

type AssetAssignment = AssetRecord["workstationAssignments"][number];
const CURRENT_WORKSTATION_ASSET_STATUSES = new Set(["ACTIVE", "TEMPORARY_REPLACEMENT"]);
const SIDE_BASED_TYPES = new Set(["monitor", "keyboard", "mouse", "tv"]);
const POSITION_BASED_TYPES = new Set(["tv"]);

function normalizeAssetTypeName(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function normalizeFlowCode(value?: string | null): FlowCode | null {
  if (!value) return null;

  if (value === "Flow-01" || value === "1st Flow") return "Flow-01";
  if (value === "Flow-02" || value === "2nd Flow") return "Flow-02";

  const normalized = value.trim().toLowerCase();
  if (normalized === "flow-01" || normalized === "1st flow") return "Flow-01";
  if (normalized === "flow-02" || normalized === "2nd flow") return "Flow-02";

  return null;
}

export function flowCodeToLabel(flowCode?: FlowCode | null) {
  if (flowCode === "Flow-01") return "1st Flow";
  if (flowCode === "Flow-02") return "2nd Flow";
  return null;
}

export function getFlowCodeFromWorkstationCode(workstationCode?: string | null): FlowCode | null {
  if (!workstationCode) return null;

  const numericCode = Number.parseInt(workstationCode.replace(/\D/g, ""), 10);
  if (Number.isNaN(numericCode)) return null;

  if (numericCode >= 7 && numericCode <= 12) return "Flow-01";
  if (numericCode >= 1 && numericCode <= 6) return "Flow-02";
  return null;
}

export function getWorkstationCodesForFlow(flowCode: FlowCode) {
  return flowCode === "Flow-01"
    ? ["WS-07", "WS-08", "WS-09", "WS-10", "WS-11", "WS-12"]
    : ["WS-01", "WS-02", "WS-03", "WS-04", "WS-05", "WS-06"];
}

export function getActiveAssignment(asset: AssetRecord): AssetAssignment | null {
  return (
    asset.workstationAssignments.find(
      (assignment) =>
        assignment.isActive || (assignment as { status?: string | null }).status === "ACTIVE"
    ) ?? null
  );
}

export function getAssignmentWorkstationCode(asset: AssetRecord) {
  return getActiveAssignment(asset)?.workstation?.code ?? asset.workstationCode ?? null;
}

export function getAssignmentWorkstationId(asset: AssetRecord) {
  return getActiveAssignment(asset)?.workstation?.id ?? null;
}

export function getAssignmentGeneralLocation(asset: AssetRecord) {
  const activeAssignment = getActiveAssignment(asset);
  return activeAssignment?.generalLocation ?? asset.generalLocation ?? null;
}

export function getAssignmentSpecificLocation(asset: AssetRecord) {
  const activeAssignment = getActiveAssignment(asset);
  return activeAssignment?.specificLocationNotes ?? asset.specificLocationNotes ?? null;
}

export function getAssignmentSide(asset: AssetRecord) {
  const activeAssignment = getActiveAssignment(asset);
  return activeAssignment?.side ?? asset.side ?? null;
}

export function getAssignmentPosition(asset: AssetRecord) {
  const activeAssignment = getActiveAssignment(asset);
  return activeAssignment?.position ?? asset.position ?? null;
}

export function getPlacementSideOptions(assetType?: string | null) {
  const normalizedType = normalizeAssetTypeName(assetType);

  if (SIDE_BASED_TYPES.has(normalizedType)) {
    return ["Left", "Right"];
  }

  return [];
}

export function getPlacementPositionOptions(assetType?: string | null) {
  const normalizedType = normalizeAssetTypeName(assetType);

  if (POSITION_BASED_TYPES.has(normalizedType)) {
    return ["Up", "Down"];
  }

  return [];
}

export function supportsPlacementSide(assetType?: string | null) {
  return getPlacementSideOptions(assetType).length > 0;
}

export function supportsPlacementPosition(assetType?: string | null) {
  return getPlacementPositionOptions(assetType).length > 0;
}

export function getPlacementValue(parts: {
  side?: string | null;
  position?: string | null;
}) {
  return [parts.side, parts.position].filter(Boolean).join(" / ") || null;
}

export function getPlacementLabel(assetType?: string | null) {
  return supportsPlacementPosition(assetType) ? "Placement" : "Side";
}

export function getAssetFlowCode(asset: AssetRecord) {
  return (
    normalizeFlowCode(asset.flow) ??
    getFlowCodeFromWorkstationCode(getAssignmentWorkstationCode(asset))
  );
}

export function isWorkstationLinkedAsset(asset: AssetRecord) {
  return Boolean(getActiveAssignment(asset)?.workstation?.code);
}

export function isCurrentWorkstationAsset(asset: AssetRecord) {
  return (
    isWorkstationLinkedAsset(asset) &&
    CURRENT_WORKSTATION_ASSET_STATUSES.has(asset.status)
  );
}

export function isNonWorkstationAsset(asset: AssetRecord) {
  return !isWorkstationLinkedAsset(asset);
}

export function getAssetScopeLabel(asset: AssetRecord) {
  return asset.assetScope ?? (isWorkstationLinkedAsset(asset) ? "Workstation Device" : "Other / Non-Workstation Device");
}

export function getAssetLocationLabel(asset: AssetRecord) {
  const activeAssignment = getActiveAssignment(asset);
  if (activeAssignment?.workstation?.code) {
    return [activeAssignment.workstation.code, activeAssignment.side, activeAssignment.position].filter(Boolean).join(" / ");
  }

  return (
    asset.currentLocationDisplay ??
    asset.displayLocation ??
    activeAssignment?.specificLocationNotes ??
    activeAssignment?.generalLocation ??
    getPlacementValue({
      side: activeAssignment?.side ?? asset.side,
      position: activeAssignment?.position ?? asset.position
    }) ??
    asset.generalLocation ??
    asset.currentLocation ??
    "Not recorded"
  );
}

export function matchesAssetTypeFilter(assetType: string, filter?: string | null) {
  if (!filter) return true;
  const normalizedAssetType = assetType.trim().toLowerCase();
  const normalizedFilter = filter.trim().toLowerCase();

  if (normalizedFilter === "tab") return normalizedAssetType === "tablet";
  return normalizedAssetType === normalizedFilter;
}

export function normalizeSearchText(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}
