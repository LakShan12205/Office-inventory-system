import { cache } from "react";
import { CurrentUser } from "./types";

export class ApiError extends Error {
  status?: number;
  issues?: Array<{ path?: string; message: string }>;

  constructor(
    message: string,
    issues?: Array<{ path?: string; message: string }>,
    status?: number
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.issues = issues;
  }
}

const AUTH_LOGOUT_MARKER_KEY = "office_inventory_logged_out";
const LEGACY_AUTH_COOKIE_NAMES = ["token", "auth_token"];
type AuthEnvelope = {
  user?: CurrentUser | null;
  data?: {
    user?: CurrentUser | null;
  } | null;
};

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

function normalizeSiteUrl(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function isBrowser() {
  return typeof window !== "undefined";
}

function getRequestMethod(init?: RequestInit) {
  return (init?.method ?? "GET").toUpperCase();
}

function isPublicApiPath(path: string, method: string) {
  return (
    path === "/auth/login" ||
    path === "/auth/logout" ||
    path === "/request-access" ||
    path === "/health" ||
    (path === "/access-requests" && method === "POST")
  );
}

function clearLogoutMarker() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(AUTH_LOGOUT_MARKER_KEY);
  window.sessionStorage.removeItem(AUTH_LOGOUT_MARKER_KEY);
}

function expireLegacyAuthCookies() {
  if (!isBrowser()) {
    return;
  }

  for (const cookieName of LEGACY_AUTH_COOKIE_NAMES) {
    document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
  }
}

export function clearBrowserAuthSession(markLoggedOut = true) {
  if (!isBrowser()) {
    return;
  }

  if (markLoggedOut) {
    window.localStorage.setItem(AUTH_LOGOUT_MARKER_KEY, "1");
    window.sessionStorage.setItem(AUTH_LOGOUT_MARKER_KEY, "1");
  } else {
    clearLogoutMarker();
  }

  expireLegacyAuthCookies();
}

export function hasClientLoggedOut() {
  if (!isBrowser()) {
    return false;
  }

  return (
    window.localStorage.getItem(AUTH_LOGOUT_MARKER_KEY) === "1" ||
    window.sessionStorage.getItem(AUTH_LOGOUT_MARKER_KEY) === "1"
  );
}

function redirectToLogin() {
  if (!isBrowser() || window.location.pathname === "/login") {
    return;
  }

  window.location.replace("/login");
}

function handleBrowserUnauthorized(path: string, method: string) {
  if (!isBrowser() || isPublicApiPath(path, method)) {
    return;
  }

  clearBrowserAuthSession(true);
  redirectToLogin();
}

function normalizeAuthUser(response: AuthEnvelope | null | undefined) {
  return response?.user ?? response?.data?.user ?? null;
}

function getApiBaseUrl() {
  if (typeof window !== "undefined") {
    return "/api";
  }

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return `${normalizeSiteUrl(siteUrl)}/api`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  const headers = new Headers(init?.headers ?? {});
  const method = getRequestMethod(init);
  const isFormDataBody =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (!isFormDataBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (isBrowser()) {
    if (hasClientLoggedOut() && !isPublicApiPath(path, method)) {
      redirectToLogin();
      throw new ApiError("Your session has ended. Please sign in again.", undefined, 401);
    }
  }

  if (!isBrowser()) {
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
      headers,
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
    if (response.status === 401) {
      handleBrowserUnauthorized(path, method);
    }

    throw new ApiError(
      getReadableApiErrorMessage(response.status, data),
      Array.isArray(data?.error?.issues) ? data.error.issues : undefined,
      response.status
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
    body:
      typeof FormData !== "undefined" && payload instanceof FormData
        ? payload
        : JSON.stringify(payload)
  });
}

export async function updateAsset(id: string, payload: unknown) {
  return request(`/assets/${id}`, {
    method: "PATCH",
    body:
      typeof FormData !== "undefined" && payload instanceof FormData
        ? payload
        : JSON.stringify(payload)
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

export async function createWorkstationAssignment(workstationId: string, payload: unknown) {
  return request(`/workstations/${workstationId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function updateAlert(alertId: string, payload: { action: "read" | "dismiss" }) {
  return request(`/alerts/${alertId}`, {
    method: "PUT",
    body: JSON.stringify({
      status: payload.action === "read" ? "READ" : "RESOLVED"
    })
  });
}

export async function loginUser(payload: { username: string; password: string }) {
  const data = await request<{
    token?: string;
    user?: CurrentUser | null;
    data?: {
      user?: CurrentUser | null;
    } | null;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  clearLogoutMarker();

  return {
    ...data,
    user: normalizeAuthUser(data)
  };
}

export async function logoutUser() {
  if (hasClientLoggedOut()) {
    clearBrowserAuthSession(true);
    return { success: true } as const;
  }

  try {
    await request("/auth/logout", {
      method: "POST"
    });
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }
  }

  clearBrowserAuthSession(true);
  return { success: true } as const;
}

export async function getCurrentUser() {
  const data = await request<AuthEnvelope>("/auth/me");

  return {
    ...data,
    user: normalizeAuthUser(data)
  };
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
  const data = await request<AuthEnvelope>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(payload)
  });

  return {
    ...data,
    user: normalizeAuthUser(data)
  };
}

export async function getAccessRequests() {
  return request<{ requests: import("./types").AccessRequestRecord[] }>("/access-requests");
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
