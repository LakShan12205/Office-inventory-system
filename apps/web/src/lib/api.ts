import { cache } from "react";

function normalizeApiBase(url: string) {
  return url.endsWith("/api") ? url : `${url}/api`;
}

function getWebApiBaseUrl() {
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

function getBackendApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  }

  return "http://localhost:4000/api";
}

async function request<T>(
  path: string,
  init?: RequestInit,
  target: "web" | "backend" = "web"
): Promise<T> {
  const baseUrl = target === "backend" ? getBackendApiBaseUrl() : getWebApiBaseUrl();
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

// Dashboard counts should reflect the same live backend inventory state as the
// Assets module. Keep this uncached so new assets show up immediately.
export async function getDashboard() {
  return request("/dashboard", undefined, "backend");
}
// Workstation views depend on mutable assignment state from assets, repairs, and
// replacements. Keep these reads uncached so every page reflects the latest
// active assignment data.
export async function getWorkstations(query = "") {
  return request(`/workstations${query}`, undefined, "backend");
}

export async function getWorkstation(id: string) {
  return request(`/workstations/${id}`, undefined, "backend");
}

export async function getBackendWorkstations(query = "") {
  return request(`/workstations${query}`, undefined, "backend");
}

export async function getBackendWorkstation(id: string) {
  return request(`/workstations/${id}`, undefined, "backend");
}
// Assets are the first module cut over to the real Express/Prisma API.
// Keep them uncached so create/edit flows reflect the latest DB state immediately.
export async function getAssets(query = "") {
  return request(`/assets${query}`, undefined, "backend");
}

export async function getAsset(id: string) {
  return request(`/assets/${id}`, undefined, "backend");
}
export const getAssetTypes = cache(async () => request("/assets/types/all", undefined, "backend"));
export const getRepairs = cache(async (query = "") => request(`/repairs${query}`, undefined, "backend"));
export const getAlerts = cache(async (query = "") => request(`/alerts${query}`));
export const getReplacements = cache(async () => request("/replacements"));
export const getBackendReplacements = cache(async () => request("/replacements", undefined, "backend"));

export async function createReplacement(payload: unknown) {
  return request("/replacements", {
    method: "POST",
    body: JSON.stringify(payload)
  }, "backend");
}

export async function createRepair(payload: unknown) {
  return request("/repairs", {
    method: "POST",
    body: JSON.stringify(payload)
  }, "backend");
}

export async function createAsset(payload: unknown) {
  return request("/assets", {
    method: "POST",
    body: JSON.stringify(payload)
  }, "backend");
}

export async function updateAsset(id: string, payload: unknown) {
  return request(`/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  }, "backend");
}

export async function archiveAsset(id: string) {
  return request(`/assets/${id}/archive`, {
    method: "POST"
  }, "backend");
}

export async function createWorkstationAssignment(
  workstationId: string,
  payload: unknown
) {
  return request(`/workstations/${workstationId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload)
  }, "backend");
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
