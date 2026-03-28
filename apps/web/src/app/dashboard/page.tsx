import { cache } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const USE_MOCK_DATA = process.env.USE_MOCK_DATA === "true";

type DashboardData = {
  stats: {
    totalWorkstations: number;
    totalAssets: number;
    machinesInRepair: number;
    activeTemporaryReplacements: number;
    overdueRepairs: number;
  };
  latestAlerts: Array<{
    id: string;
    type: string;
    message: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    createdAt: string;
    workstation?: { id: string; code: string } | null;
    asset?: { id: string; assetCode: string } | null;
  }>;
  recentRepairs: Array<{
    id: string;
    status: string;
    faultDescription: string;
    reportedDate: string;
    expectedReturnDate?: string | null;
    asset: { id: string; assetCode: string; assetType?: { name: string } };
    workstation: { id: string; code: string };
    replacementLog?: {
      replacementAsset: { id: string; assetCode: string };
    } | null;
  }>;
};

type WorkstationListItem = {
  id: string;
  code: string;
  location: string;
  status: string;
  assetCount: number;
  machineCount: number;
};

type WorkstationDetail = {
  id: string;
  code: string;
  location: string;
  status: string;
  assets: Array<{
    id: string;
    asset: {
      id: string;
      assetCode: string;
      brand: string;
      model: string;
      status: string;
      assetType: { name: string };
    };
    assignmentType: string;
    assignedDate: string;
  }>;
  repairs: Array<{
    id: string;
    status: string;
    faultDescription: string;
    reportedDate: string;
    expectedReturnDate?: string | null;
    asset: { id: string; assetCode: string };
    replacementLog?: {
      replacementAsset: { id: string; assetCode: string };
    } | null;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    createdAt: string;
  }>;
};

type AssetListItem = {
  id: string;
  assetCode: string;
  serialNumber?: string | null;
  brand: string;
  model: string;
  specification?: string | null;
  status: string;
  currentLocation?: string | null;
  assetType: { id: string; name: string };
  workstation?: { id: string; code: string } | null;
};

type AssetDetail = {
  id: string;
  assetCode: string;
  serialNumber?: string | null;
  brand: string;
  model: string;
  specification?: string | null;
  status: string;
  currentLocation?: string | null;
  notes?: string | null;
  assetType: { id: string; name: string };
  assignmentHistory: Array<{
    id: string;
    workstation: { id: string; code: string };
    assignmentType: string;
    assignedDate: string;
    removedDate?: string | null;
  }>;
  repairs: Array<{
    id: string;
    status: string;
    faultDescription: string;
    reportedDate: string;
    expectedReturnDate?: string | null;
    actualReturnDate?: string | null;
    diagnosis?: string | null;
    repairAction?: string | null;
    partsChanged?: string | null;
  }>;
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    createdAt: string;
  }>;
};

type RepairListItem = {
  id: string;
  status: string;
  faultDescription: string;
  reportedDate: string;
  expectedReturnDate?: string | null;
  actualReturnDate?: string | null;
  asset: { id: string; assetCode: string };
  workstation: { id: string; code: string };
  replacementLog?: {
    replacementAsset: { id: string; assetCode: string };
  } | null;
};

type AlertListItem = {
  id: string;
  type: string;
  message: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: string;
  createdAt: string;
  workstation?: { id: string; code: string } | null;
  asset?: { id: string; assetCode: string } | null;
};

type ReplacementListItem = {
  id: string;
  status: string;
  replacementDate: string;
  replacementReturnDate?: string | null;
  originalAsset: { id: string; assetCode: string };
  replacementAsset: { id: string; assetCode: string };
  workstation: { id: string; code: string };
};

type AssetTypeItem = {
  id: string;
  name: string;
};

const mockAssetTypes: AssetTypeItem[] = [
  { id: "type-machine", name: "Machine" },
  { id: "type-monitor", name: "Monitor" },
  { id: "type-tv", name: "TV" },
  { id: "type-ups", name: "UPS" },
  { id: "type-keyboard", name: "Keyboard" },
  { id: "type-mouse", name: "Mouse" },
  { id: "type-tablet", name: "Tablet" },
  { id: "type-phone", name: "Phone" },
  { id: "type-vga", name: "VGA Cable" }
];

const mockWorkstations: WorkstationListItem[] = [
  { id: "ws-01", code: "WS-01", location: "1st Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-02", code: "WS-02", location: "1st Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-03", code: "WS-03", location: "1st Floor", status: "NEEDS_ATTENTION", assetCount: 20, machineCount: 2 },
  { id: "ws-04", code: "WS-04", location: "1st Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-05", code: "WS-05", location: "2nd Floor", status: "NEEDS_ATTENTION", assetCount: 20, machineCount: 2 },
  { id: "ws-06", code: "WS-06", location: "2nd Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-07", code: "WS-07", location: "2nd Floor", status: "NEEDS_ATTENTION", assetCount: 20, machineCount: 2 },
  { id: "ws-08", code: "WS-08", location: "2nd Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-09", code: "WS-09", location: "3rd Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-10", code: "WS-10", location: "3rd Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-11", code: "WS-11", location: "3rd Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-12", code: "WS-12", location: "3rd Floor", status: "ACTIVE", assetCount: 20, machineCount: 2 }
];

const mockAssets: AssetListItem[] = [
  {
    id: "asset-mach-005",
    assetCode: "MACH-005",
    serialNumber: "SN-MACH-005",
    brand: "Dell",
    model: "OptiPlex 7090",
    specification: "Core i7, 16GB RAM, 512GB SSD",
    status: "IN_REPAIR",
    currentLocation: "TechFix Workshop",
    assetType: { id: "type-machine", name: "Machine" },
    workstation: { id: "ws-03", code: "WS-03" }
  },
  {
    id: "asset-mach-025",
    assetCode: "MACH-025",
    serialNumber: "SN-MACH-025",
    brand: "HP",
    model: "ProDesk 600",
    specification: "Core i5, 8GB RAM, 256GB SSD",
    status: "TEMPORARY_REPLACEMENT",
    currentLocation: "WS-03",
    assetType: { id: "type-machine", name: "Machine" },
    workstation: { id: "ws-03", code: "WS-03" }
  },
  {
    id: "asset-mach-013",
    assetCode: "MACH-013",
    serialNumber: "SN-MACH-013",
    brand: "Lenovo",
    model: "ThinkCentre M70",
    specification: "Core i5, 8GB RAM, 512GB SSD",
    status: "ACTIVE",
    currentLocation: "WS-07",
    assetType: { id: "type-machine", name: "Machine" },
    workstation: { id: "ws-07", code: "WS-07" }
  },
  {
    id: "asset-mach-026",
    assetCode: "MACH-026",
    serialNumber: "SN-MACH-026",
    brand: "Dell",
    model: "OptiPlex 5070",
    specification: "Core i5, 8GB RAM, 256GB SSD",
    status: "TEMPORARY_REPLACEMENT",
    currentLocation: "WS-07",
    assetType: { id: "type-machine", name: "Machine" },
    workstation: { id: "ws-07", code: "WS-07" }
  },
  {
    id: "asset-mach-017",
    assetCode: "MACH-017",
    serialNumber: "SN-MACH-017",
    brand: "HP",
    model: "EliteDesk 800",
    specification: "Core i7, 16GB RAM, 512GB SSD",
    status: "ACTIVE",
    currentLocation: "WS-09",
    assetType: { id: "type-machine", name: "Machine" },
    workstation: { id: "ws-09", code: "WS-09" }
  },
  {
    id: "asset-mon-001",
    assetCode: "MON-001",
    serialNumber: "SN-MON-001",
    brand: "Samsung",
    model: "24-inch",
    specification: "24 inch LED",
    status: "ACTIVE",
    currentLocation: "WS-01",
    assetType: { id: "type-monitor", name: "Monitor" },
    workstation: { id: "ws-01", code: "WS-01" }
  },
  {
    id: "asset-mon-ws-01-1",
    assetCode: "MON-WS-01-1",
    serialNumber: "SN-MON-WS-01-1",
    brand: "LG",
    model: "22-inch",
    specification: "22 inch LED",
    status: "ACTIVE",
    currentLocation: "WS-01",
    assetType: { id: "type-monitor", name: "Monitor" },
    workstation: { id: "ws-01", code: "WS-01" }
  }
];

const mockRepairs: RepairListItem[] = [
  {
    id: "repair-001",
    status: "IN_PROGRESS",
    faultDescription: "No display / random shutdown",
    reportedDate: "2026-03-15",
    expectedReturnDate: "2026-03-20",
    actualReturnDate: null,
    asset: { id: "asset-mach-005", assetCode: "MACH-005" },
    workstation: { id: "ws-03", code: "WS-03" },
    replacementLog: {
      replacementAsset: { id: "asset-mach-025", assetCode: "MACH-025" }
    }
  },
  {
    id: "repair-002",
    status: "RETURNED",
    faultDescription: "Motherboard issue",
    reportedDate: "2026-03-20",
    expectedReturnDate: "2026-03-24",
    actualReturnDate: "2026-03-24",
    asset: { id: "asset-mach-013", assetCode: "MACH-013" },
    workstation: { id: "ws-07", code: "WS-07" },
    replacementLog: {
      replacementAsset: { id: "asset-mach-026", assetCode: "MACH-026" }
    }
  },
  {
    id: "repair-003",
    status: "CLOSED",
    faultDescription: "Repeated overheating",
    reportedDate: "2026-02-10",
    expectedReturnDate: "2026-02-12",
    actualReturnDate: "2026-02-12",
    asset: { id: "asset-mach-017", assetCode: "MACH-017" },
    workstation: { id: "ws-09", code: "WS-09" },
    replacementLog: null
  }
];

const mockAlerts: AlertListItem[] = [
  {
    id: "alert-001",
    type: "REPAIR_OVERDUE",
    message: "Repair for MACH-005 is overdue. Expected back on 2026-03-20.",
    priority: "HIGH",
    status: "NEW",
    createdAt: "2026-03-28",
    workstation: { id: "ws-03", code: "WS-03" },
    asset: { id: "asset-mach-005", assetCode: "MACH-005" }
  },
  {
    id: "alert-002",
    type: "REPLACEMENT_ACTIVE",
    message: "WS-03 is operating with temporary replacement MACH-025.",
    priority: "MEDIUM",
    status: "NEW",
    createdAt: "2026-03-28",
    workstation: { id: "ws-03", code: "WS-03" },
    asset: { id: "asset-mach-025", assetCode: "MACH-025" }
  },
  {
    id: "alert-003",
    type: "REPLACEMENT_NOT_REMOVED",
    message: "Replacement MACH-026 is still active more than 2 days after MACH-013 returned.",
    priority: "HIGH",
    status: "NEW",
    createdAt: "2026-03-28",
    workstation: { id: "ws-07", code: "WS-07" },
    asset: { id: "asset-mach-026", assetCode: "MACH-026" }
  },
  {
    id: "alert-004",
    type: "REPEATED_REPAIR",
    message: "MACH-017 has reached 3 repair records and should be reviewed for replacement.",
    priority: "HIGH",
    status: "NEW",
    createdAt: "2026-03-28",
    workstation: { id: "ws-09", code: "WS-09" },
    asset: { id: "asset-mach-017", assetCode: "MACH-017" }
  },
  {
    id: "alert-005",
    type: "ORIGINAL_RETURNED",
    message: "Original machine MACH-013 returned to WS-07 on 2026-03-24.",
    priority: "MEDIUM",
    status: "READ",
    createdAt: "2026-03-24",
    workstation: { id: "ws-07", code: "WS-07" },
    asset: { id: "asset-mach-013", assetCode: "MACH-013" }
  },
  {
    id: "alert-006",
    type: "MACHINE_SENT_FOR_REPAIR",
    message: "MACH-005 was sent to TechFix Workshop on 2026-03-15.",
    priority: "MEDIUM",
    status: "NEW",
    createdAt: "2026-03-15",
    workstation: { id: "ws-03", code: "WS-03" },
    asset: { id: "asset-mach-005", assetCode: "MACH-005" }
  }
];

const mockReplacements: ReplacementListItem[] = [
  {
    id: "replacement-001",
    status: "ACTIVE",
    replacementDate: "2026-03-15",
    replacementReturnDate: null,
    originalAsset: { id: "asset-mach-005", assetCode: "MACH-005" },
    replacementAsset: { id: "asset-mach-025", assetCode: "MACH-025" },
    workstation: { id: "ws-03", code: "WS-03" }
  },
  {
    id: "replacement-002",
    status: "PENDING_RESTORE",
    replacementDate: "2026-03-20",
    replacementReturnDate: null,
    originalAsset: { id: "asset-mach-013", assetCode: "MACH-013" },
    replacementAsset: { id: "asset-mach-026", assetCode: "MACH-026" },
    workstation: { id: "ws-07", code: "WS-07" }
  }
];

const mockDashboard: DashboardData = {
  stats: {
    totalWorkstations: 12,
    totalAssets: mockAssets.length,
    machinesInRepair: mockAssets.filter((a) => a.status === "IN_REPAIR").length,
    activeTemporaryReplacements: mockReplacements.filter(
      (r) => r.status === "ACTIVE" || r.status === "PENDING_RESTORE"
    ).length,
    overdueRepairs: 1
  },
  latestAlerts: mockAlerts.slice(0, 5),
  recentRepairs: mockRepairs.map((repair) => ({
    ...repair,
    asset: {
      ...repair.asset,
      assetType: { name: "Machine" }
    }
  }))
};

function getQueryValue(query: string, key: string): string {
  if (!query) return "";
  const normalized = query.startsWith("?") ? query.slice(1) : query;
  const params = new URLSearchParams(normalized);
  return params.get(key) ?? "";
}

function filterAssets(query = ""): AssetListItem[] {
  const search = getQueryValue(query, "search").toLowerCase().trim();
  const type = getQueryValue(query, "type").toLowerCase().trim();
  const status = getQueryValue(query, "status").toUpperCase().trim();

  return mockAssets.filter((asset) => {
    const matchesSearch =
      !search ||
      asset.assetCode.toLowerCase().includes(search) ||
      (asset.serialNumber ?? "").toLowerCase().includes(search) ||
      (asset.workstation?.code ?? "").toLowerCase().includes(search);

    const matchesType = !type || asset.assetType.name.toLowerCase() === type;
    const matchesStatus = !status || asset.status === status;

    return matchesSearch && matchesType && matchesStatus;
  });
}

function filterWorkstations(query = ""): WorkstationListItem[] {
  const search = getQueryValue(query, "search").toLowerCase().trim();
  const status = getQueryValue(query, "status").toUpperCase().trim();

  return mockWorkstations.filter((ws) => {
    const matchesSearch =
      !search ||
      ws.code.toLowerCase().includes(search) ||
      ws.location.toLowerCase().includes(search);

    const matchesStatus = !status || ws.status === status;
    return matchesSearch && matchesStatus;
  });
}

function filterRepairs(query = ""): RepairListItem[] {
  const status = getQueryValue(query, "status").toUpperCase().trim();
  return mockRepairs.filter((repair) => !status || repair.status === status);
}

function filterAlerts(query = ""): AlertListItem[] {
  const status = getQueryValue(query, "status").toUpperCase().trim();
  const priority = getQueryValue(query, "priority").toUpperCase().trim();

  return mockAlerts.filter((alert) => {
    const matchesStatus = !status || alert.status === status;
    const matchesPriority = !priority || alert.priority === priority;
    return matchesStatus && matchesPriority;
  });
}

function getMockWorkstation(id: string): WorkstationDetail {
  const workstation = mockWorkstations.find((ws) => ws.id === id);
  if (!workstation) {
    throw new Error("Workstation not found");
  }

  return {
    ...workstation,
    assets: mockAssets
      .filter((asset) => asset.workstation?.id === id)
      .map((asset, index) => ({
        id: `assignment-${asset.id}`,
        asset,
        assignmentType: asset.status === "TEMPORARY_REPLACEMENT" ? "Temporary Replacement" : "Assigned",
        assignedDate: `2026-03-${String(index + 1).padStart(2, "0")}`
      })),
    repairs: mockRepairs.filter((repair) => repair.workstation.id === id),
    alerts: mockAlerts
      .filter((alert) => alert.workstation?.id === id)
      .map(({ workstation: _workstation, asset: _asset, ...alert }) => alert)
  };
}

function getMockAsset(id: string): AssetDetail {
  const asset = mockAssets.find((item) => item.id === id);
  if (!asset) {
    throw new Error("Asset not found");
  }

  return {
    ...asset,
    notes: "Mock asset record for demo review.",
    assignmentHistory: asset.workstation
      ? [
          {
            id: `history-${asset.id}`,
            workstation: asset.workstation,
            assignmentType: asset.status === "TEMPORARY_REPLACEMENT" ? "Temporary Replacement" : "Assigned",
            assignedDate: "2026-03-01",
            removedDate: null
          }
        ]
      : [],
    repairs: mockRepairs
      .filter((repair) => repair.asset.id === id)
      .map((repair) => ({
        id: repair.id,
        status: repair.status,
        faultDescription: repair.faultDescription,
        reportedDate: repair.reportedDate,
        expectedReturnDate: repair.expectedReturnDate ?? null,
        actualReturnDate: repair.actualReturnDate ?? null,
        diagnosis: repair.status === "RETURNED" || repair.status === "CLOSED" ? "Diagnosed and repaired" : null,
        repairAction: repair.status === "RETURNED" || repair.status === "CLOSED" ? "Component service completed" : null,
        partsChanged: repair.status === "RETURNED" || repair.status === "CLOSED" ? "Cooling fan, thermal paste" : null
      })),
    alerts: mockAlerts
      .filter((alert) => alert.asset?.id === id)
      .map(({ workstation: _workstation, asset: _asset, ...alert }) => alert)
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error((data as { error?: { message?: string } })?.error?.message || "Request failed");
  }

  return data as T;
}

async function mockRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const method = (init?.method || "GET").toUpperCase();

  if (method === "POST") {
    return { success: true, message: "Saved successfully in mock mode." } as T;
  }

  if (path === "/dashboard") {
    return mockDashboard as T;
  }

  if (path.startsWith("/workstations/") && !path.endsWith("/assignments")) {
    const id = path.split("/")[2];
    return getMockWorkstation(id) as T;
  }

  if (path.startsWith("/workstations")) {
    const query = path.includes("?") ? `?${path.split("?")[1]}` : "";
    return filterWorkstations(query) as T;
  }

  if (path.startsWith("/assets/types/all")) {
    return mockAssetTypes as T;
  }

  if (path.startsWith("/assets/") && !path.includes("?")) {
    const id = path.split("/")[2];
    return getMockAsset(id) as T;
  }

  if (path.startsWith("/assets")) {
    const query = path.includes("?") ? `?${path.split("?")[1]}` : "";
    return filterAssets(query) as T;
  }

  if (path.startsWith("/repairs")) {
    const query = path.includes("?") ? `?${path.split("?")[1]}` : "";
    return filterRepairs(query) as T;
  }

  if (path.startsWith("/alerts")) {
    const query = path.includes("?") ? `?${path.split("?")[1]}` : "";
    return filterAlerts(query) as T;
  }

  if (path.startsWith("/replacements")) {
    return mockReplacements as T;
  }

  throw new Error(`Mock route not implemented: ${path}`);
}

async function safeRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (USE_MOCK_DATA) {
    return mockRequest<T>(path, init);
  }
  return request<T>(path, init);
}

export const getDashboard = cache(() => safeRequest<DashboardData>("/dashboard"));
export const getWorkstations = cache((query = "") => safeRequest<WorkstationListItem[]>(`/workstations${query}`));
export const getWorkstation = cache((id: string) => safeRequest<WorkstationDetail>(`/workstations/${id}`));
export const getAssets = cache((query = "") => safeRequest<AssetListItem[]>(`/assets${query}`));
export const getAsset = cache((id: string) => safeRequest<AssetDetail>(`/assets/${id}`));
export const getAssetTypes = cache(() => safeRequest<AssetTypeItem[]>("/assets/types/all"));
export const getRepairs = cache((query = "") => safeRequest<RepairListItem[]>(`/repairs${query}`));
export const getAlerts = cache((query = "") => safeRequest<AlertListItem[]>(`/alerts${query}`));
export const getReplacements = cache(() => safeRequest<ReplacementListItem[]>("/replacements"));

export async function createRepair(payload: unknown) {
  return safeRequest("/repairs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createAsset(payload: unknown) {
  return safeRequest("/assets", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createWorkstationAssignment(workstationId: string, payload: unknown) {
  return safeRequest(`/workstations/${workstationId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export { API_URL, USE_MOCK_DATA };