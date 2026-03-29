import { cache } from "react";

function getApiBaseUrl() {
  // Use relative API path for both browser and server
  // This avoids Vercel URL issues in many Next.js app-router setups
  return "/api";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;

  try {
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
  } catch (error) {
    console.error("Fetch error:", {
      url,
      error
    });

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Unexpected request error");
  }
}

export const getDashboard = cache(async () => {
  return await request("/dashboard");
});

export const getWorkstations = cache(async (query = "") => {
  return await request(`/workstations${query}`);
});

export const getWorkstation = cache(async (id: string) => {
  return await request(`/workstations/${id}`);
});

export const getAssets = cache(async (query = "") => {
  return await request(`/assets${query}`);
});

export const getAsset = cache(async (id: string) => {
  return await request(`/assets/${id}`);
});

export const getAssetTypes = cache(async () => {
  return await request("/assets/types/all");
});

export const getRepairs = cache(async (query = "") => {
  return await request(`/repairs${query}`);
});

export const getAlerts = cache(async (query = "") => {
  return await request(`/alerts${query}`);
});

export const getReplacements = cache(async () => {
  return await request("/replacements");
});

export async function createRepair(payload: unknown) {
  return await request("/repairs", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createAsset(payload: unknown) {
  return await request("/assets", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export async function createWorkstationAssignment(
  workstationId: string,
  payload: unknown
) {
  return await request(`/workstations/${workstationId}/assignments`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}