import { cache } from "react";

function getApiBaseUrl() {
  // Browser side
  if (typeof window !== "undefined") {
    return "/api";
  }

  // Server side
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return `${process.env.NEXT_PUBLIC_SITE_URL}/api`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }

  return "http://localhost:3000/api";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const rawText = await response.text();

  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText || "Non-JSON response received" };
  }

  if (!response.ok) {
    console.error("API request failed", {
      url,
      status: response.status,
      statusText: response.statusText,
      body: data
    });

    throw new Error(
      data?.error?.message ||
        data?.message ||
        `Request failed with status ${response.status}`
    );
  }

  return data as T;
}

export const getDashboard = cache(async () => request("/dashboard"));
export const getWorkstations = cache(async (query = "") => request(`/workstations${query}`));
export const getWorkstation = cache(async (id: string) => request(`/workstations/${id}`));
// Asset reads stay uncached because the demo mutates in-memory mock data at runtime
// and pages like /repairs/new must see the exact latest asset state immediately.
export async function getAssets(query = "") {
  return request(`/assets${query}`);
}

export async function getAsset(id: string) {
  return request(`/assets/${id}`);
}
export const getAssetTypes = cache(async () => request("/assets/types/all"));
export const getRepairs = cache(async (query = "") => request(`/repairs${query}`));
export const getAlerts = cache(async (query = "") => request(`/alerts${query}`));
export const getReplacements = cache(async () => request("/replacements"));

export async function createReplacement(payload: unknown) {
  return request("/replacements", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createRepair(payload: unknown) {
  return request("/repairs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createAsset(payload: unknown) {
  return request("/assets", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createWorkstationAssignment(
  workstationId: string,
  payload: unknown
) {
  return request(`/workstations/${workstationId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAlert(
  alertId: string,
  payload: { action: "read" | "dismiss" }
) {
  return request(`/alerts/${alertId}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}
