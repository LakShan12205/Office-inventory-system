import { cache } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

/* ---------------- MOCK DATA ---------------- */

const mockWorkstations = [
  { id: "ws-01", code: "WS-01", location: "Floor 1", status: "ACTIVE", assetCount: 20, machineCount: 2 },
  { id: "ws-02", code: "WS-02", location: "Floor 1", status: "ACTIVE", assetCount: 20, machineCount: 2 }
];

const mockAssets = [
  {
    id: "a1",
    assetCode: "MACH-001",
    brand: "Dell",
    model: "Optiplex",
    serialNumber: "SN001",
    status: "ACTIVE",
    assetType: { name: "Machine" },
    workstation: { code: "WS-01" }
  },
  {
    id: "a2",
    assetCode: "MACH-002",
    brand: "HP",
    model: "EliteDesk",
    serialNumber: "SN002",
    status: "IN_REPAIR",
    assetType: { name: "Machine" },
    workstation: { code: "WS-02" }
  }
];

const mockRepairs = [
  {
    id: "r1",
    asset: { assetCode: "MACH-002" },
    workstation: { code: "WS-02" },
    reportedDate: "2026-03-20",
    faultDescription: "No power",
    status: "IN_PROGRESS",
    expectedReturnDate: "2026-03-30",
    replacementLog: {
      replacementAsset: { assetCode: "MACH-010" }
    }
  }
];

const mockAlerts = [
  {
    id: "al1",
    message: "Repair overdue",
    priority: "HIGH",
    createdAt: "2026-03-28"
  }
];

const mockReplacements = [
  {
    id: "rep1",
    workstation: { code: "WS-02" },
    originalAsset: { assetCode: "MACH-002" },
    replacementAsset: { assetCode: "MACH-010" },
    replacementDate: "2026-03-20",
    status: "ACTIVE"
  }
];

const mockDashboard = {
  stats: {
    totalWorkstations: 12,
    totalAssets: 100,
    machinesInRepair: 2,
    activeTemporaryReplacements: 1,
    overdueRepairs: 1
  },
  latestAlerts: mockAlerts,
  recentRepairs: mockRepairs
};

/* ---------------- API REQUEST ---------------- */

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error("API Error");
  return res.json();
}

/* ---------------- SAFE REQUEST ---------------- */

async function safeRequest<T>(path: string): Promise<T> {
  if (USE_MOCK_DATA) {
    if (path === "/dashboard") return mockDashboard as T;
    if (path.startsWith("/workstations")) return mockWorkstations as T;
    if (path.startsWith("/assets")) return mockAssets as T;
    if (path.startsWith("/repairs")) return mockRepairs as T;
    if (path.startsWith("/alerts")) return mockAlerts as T;
    if (path.startsWith("/replacements")) return mockReplacements as T;
  }
  return request<T>(path);
}

/* ---------------- EXPORT FUNCTIONS ---------------- */

export const getDashboard = cache(() => safeRequest("/dashboard"));
export const getWorkstations = cache((q = "") => safeRequest(`/workstations${q}`));
export const getAssets = cache((q = "") => safeRequest(`/assets${q}`));
export const getRepairs = cache((q = "") => safeRequest(`/repairs${q}`));
export const getAlerts = cache((q = "") => safeRequest(`/alerts${q}`));
export const getReplacements = cache(() => safeRequest(`/replacements`));

export const API_BASE = API_URL;