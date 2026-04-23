import { cache } from "react";

export class ApiError extends Error {
  issues?: Array<{ path?: string; message: string }>;

  constructor(message: string, issues?: Array<{ path?: string; message: string }>) {
    super(message);
    this.name = "ApiError";
    this.issues = issues;
  }
}

function getReadableApiErrorMessage(status: number, data: any) {
  return (
    data?.error?.message ||
    data?.message ||
    (status >= 500
      ? "The server could not complete the request. Please try again."
      : `Request failed with status ${status}`)
  );
}

export function getApiErrorMessages(error: unknown) {
  if (error instanceof ApiError && Array.isArray(error.issues) && error.issues.length > 0) {
    return Array.from(
      new Set(
        error.issues
          .map((issue) => (typeof issue?.message === "string" ? issue.message.trim() : ""))
          .filter(Boolean)
      )
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return [error.message.trim()];
  }

  return ["Something went wrong. Please try again."];
}

function normalizeBase(url: string) {
  return url.endsWith("/api") ? url : `${url}/api`;
}

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return "/api";
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured");
  }

  return normalizeBase(siteUrl);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const headers = new Headers(init?.headers ?? {});

  if (typeof window === "undefined") {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.toString();

    if (cookieHeader && !headers.has("cookie")) {
      headers.set("cookie", cookieHeader);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...Object.fromEntries(headers.entries())
      },
      cache: "no-store",
      credentials: "include"
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error && error.message
        ? `Unable to reach the server. ${error.message}`
        : "Unable to reach the server. Please try again."
    );
  }

  const rawText = await response.text();

  let data: any = {};
  try {
    data = rawText ? JSON.parse(rawText) : {};
  } catch {
    data = { message: rawText || "Non-JSON response received" };
  }

  if (!response.ok) {
    throw new ApiError(
      getReadableApiErrorMessage(response.status, data),
      Array.isArray(data?.error?.issues) ? data.error.issues : undefined
    );
  }

  return data as T;
}

export async function getDashboard() {
  return request("/dashboard");
}

export async function getWorkstations(query = "") {
  return request(`/workstations${query}`);
}

export async function getWorkstation(id: string) {
  return request(`/workstations/${id}`);
}

export async function getBackendWorkstations(query = "") {
  return request(`/workstations${query}`);
}

export async function getBackendWorkstation(id: string) {
  return request(`/workstations/${id}`);
}

export async function getAssets(query = "") {
  return request(`/assets${query}`);
}

export async function getAsset(id: string) {
  return request(`/assets/${id}`);
}

export const getAssetTypes = cache(async () => request("/assets/types/all"));

export const getRepairs = cache(async (query = "") => request(`/repairs${query}`));

export async function getAlerts(query = "") {
  return request(`/alerts${query}`);
}

export const getReplacements = cache(async () => request("/replacements"));
export const getBackendReplacements = cache(async () => request("/replacements"));

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

export async function returnRepair(
  id: string,
  payload: {
    action: "RETURN_TO_WORKSTATION" | "MOVE_TO_STORE";
    repairedBy: string;
    notes?: string | null;
  }
) {
  return request(`/repairs/${id}/return`, {
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

export async function updateAsset(id: string, payload: unknown) {
  return request(`/assets/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload)
  });
}

export async function archiveAsset(id: string) {
  return request(`/assets/${id}/archive`, {
    method: "POST"
  });
}

export async function deleteAssetPermanently(id: string) {
  return request<{ success: true }>(`/assets/${id}`, {
    method: "DELETE"
  });
}

export async function deleteAllAssetsPermanently() {
  return request<{ deleted: number; skipped: number }>("/assets", {
    method: "DELETE"
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
    method: "PUT",
    body: JSON.stringify({
      status: payload.action === "read" ? "READ" : "RESOLVED"
    })
  });
}

export async function loginUser(payload: { username: string; password: string }) {
  return request<{ user: import("./types").CurrentUser }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function logoutUser() {
  return request("/auth/logout", {
    method: "POST"
  });
}

export async function getCurrentUser() {
  return request<{ user: import("./types").CurrentUser }>("/auth/me");
}

export async function submitAccessRequest(payload: {
  fullName: string;
  employeeId: string;
  email: string;
  requestedUsername: string;
}) {
  return request<{ message: string }>("/access-requests", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}) {
  return request<{ user: import("./types").CurrentUser }>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function getAccessRequests() {
  return request<{ requests: import("./types").AccessRequestRecord[] }>(
    "/access-requests"
  );
}

export async function approveAccessRequest(
  id: string,
  payload: { role: "ADMIN" | "SUPERVISOR" | "MANAGER" | "EMPLOYEE" }
) {
  return request<{
    user: import("./types").CurrentUser;
    temporaryPassword: string;
  }>(`/access-requests/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function rejectAccessRequest(id: string, payload?: { reason?: string | null }) {
  return request(`/access-requests/${id}/reject`, {
    method: "POST",
    body: JSON.stringify(payload ?? {})
  });
}