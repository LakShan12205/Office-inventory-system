import { cache } from "react";

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "/api";
  }

  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/api`;
  }

  return "http://localhost:3000/api";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error?.message || "Request failed");
  }

  return data as T;
}

export const getDashboard = cache(() => request("/dashboard"));
export const getWorkstations = cache((query = "") => request(`/workstations${query}`));
export const getWorkstation = cache((id: string) => request(`/workstations/${id}`));
export const getAssets = cache((query = "") => request(`/assets${query}`));
export const getAsset = cache((id: string) => request(`/assets/${id}`));
export const getAssetTypes = cache(() => request("/assets/types/all"));
export const getRepairs = cache((query = "") => request(`/repairs${query}`));
export const getAlerts = cache((query = "") => request(`/alerts${query}`));
export const getReplacements = cache(() => request("/replacements"));

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

export async function createWorkstationAssignment(workstationId: string, payload: unknown) {
  return request(`/workstations/${workstationId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
