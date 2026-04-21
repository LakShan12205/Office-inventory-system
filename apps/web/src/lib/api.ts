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

function normalizeApiBase(url: string) {
  return url.endsWith("/api") ? url : `${url}/api`;
}

/**
 * 🔥 FIXED: ALWAYS use backend API
 */
function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return normalizeApiBase(process.env.NEXT_PUBLIC_API_URL);
  }

  return "http://localhost:4000/api";
}

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  const headers = new Headers(init?.headers ?? {});

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
    console.error("API request failed", {
      url,
      status: response.status,
      statusText: response.statusText,
      body: data
    });

    throw new ApiError(
      getReadableApiErrorMessage(response.status, data),
      Array.isArray(data?.error?.issues) ? data.error.issues : undefined
    );
  }

  return data as T;
}

// ================= AUTH =================

export async function loginUser(payload: { username: string; password: string }) {
  return request<{ user: any }>("/auth/login", {
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
  return request<{ user: any }>("/auth/me");
}

// ================= DATA =================

export async function getDashboard() {
  return request("/dashboard");
}

export async function getAssets(query = "") {
  return request(`/assets${query}`);
}

export async function createAsset(payload: unknown) {
  return request("/assets", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function deleteAssetPermanently(id: string) {
  return request(`/assets/${id}`, {
    method: "DELETE"
  });
}