import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "office_inventory_auth";
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 12;

function normalizeApiBase(url: string) {
  return url.endsWith("/api") ? url : `${url}/api`;
}

function extractAuthToken(responseBody: ArrayBuffer) {
  try {
    const text = new TextDecoder().decode(responseBody);
    const data = text ? JSON.parse(text) : null;

    return typeof data?.token === "string" && data.token.trim()
      ? data.token
      : null;
  } catch {
    return null;
  }
}

function getCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .filter(Boolean);

  for (const cookie of cookies) {
    const separatorIndex = cookie.indexOf("=");
    const key = separatorIndex >= 0 ? cookie.slice(0, separatorIndex) : cookie;
    const value = separatorIndex >= 0 ? cookie.slice(separatorIndex + 1) : "";

    if (key === name) {
      return decodeURIComponent(value);
    }
  }

  return null;
}

function getResponseTopLevelKeys(responseBody: ArrayBuffer, contentType: string | null) {
  if (!contentType?.includes("application/json")) {
    return [];
  }

  try {
    const text = new TextDecoder().decode(responseBody);
    const data = text ? JSON.parse(text) : null;

    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return Array.isArray(data) ? ["<array>"] : [];
    }

    return Object.keys(data);
  } catch {
    return ["<invalid-json>"];
  }
}

function getErrorCategory(status: number) {
  if (status >= 500) return "server_error";
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 404) return "not_found";
  if (status >= 400) return "client_error";
  return "ok";
}

function buildBackendUrl(path: string) {
  const backendBase =
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.NODE_ENV === "production" ? undefined : "http://localhost:4000");

  if (!backendBase) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured.");
  }

  const normalizedBase = normalizeApiBase(backendBase.replace(/\/$/, ""));
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(`${normalizedBase}${normalizedPath}`);
}

export async function proxyToBackend(
  request: Request,
  path: string,
  init?: { method?: string; body?: BodyInit | null }
) {
  let backendUrl: URL;

  try {
    backendUrl = buildBackendUrl(path);
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          message: error instanceof Error ? error.message : "Backend URL is not configured.",
          status: 500
        }
      },
      { status: 500 }
    );
  }
  const incomingUrl = new URL(request.url);

  incomingUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  const method = init?.method ?? request.method;
  const headers = new Headers();
  const cookie = request.headers.get("cookie");
  const contentType = request.headers.get("content-type");
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const authorization = request.headers.get("authorization");
  const authCookie = getCookieValue(cookie, AUTH_COOKIE_NAME);

  if (cookie) {
    headers.set("cookie", cookie);
  }

  if (authorization) {
    headers.set("authorization", authorization);
  } else if (authCookie) {
    headers.set("authorization", `Bearer ${authCookie}`);
  }

  const isMultipartRequest = contentType?.toLowerCase().includes("multipart/form-data");

  if (contentType && method !== "GET" && method !== "HEAD" && !isMultipartRequest) {
    headers.set("content-type", contentType);
  }

  if (origin) {
    headers.set("origin", origin);
  }

  if (referer) {
    headers.set("referer", referer);
  }

  const body =
    init?.body ??
    (method === "GET" || method === "HEAD"
      ? undefined
      : isMultipartRequest
        ? await request.formData()
        : await request.arrayBuffer());

  const requestBody =
    body instanceof ArrayBuffer
      ? (body.byteLength > 0 ? body : undefined)
      : body instanceof FormData
        ? (() => {
            const forwarded = new FormData();

            body.forEach((value, key) => {
              if (value instanceof File) {
                forwarded.append(key, value, value.name);
                return;
              }

              forwarded.append(key, value);
            });

            return forwarded;
          })()
        : body ?? undefined;

  const response = await fetch(backendUrl.toString(), {
    method,
    cache: "no-store",
    credentials: "include",
    headers,
    body: requestBody
  });
  const responseBody = await response.arrayBuffer();
  const responseContentType = response.headers.get("content-type");

  console.info("Web API proxy response", {
    route: path,
    backendStatus: response.status,
    responseKeys: getResponseTopLevelKeys(responseBody, responseContentType),
    cookiePresent: Boolean(authCookie),
    errorCategory: getErrorCategory(response.status)
  });

  const nextResponse = new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": responseContentType ?? "application/json"
    }
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  if (
    response.ok &&
    (path === "/auth/login" || path === "/auth/change-password")
  ) {
    const token = extractAuthToken(responseBody);

    if (token) {
      nextResponse.cookies.set(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: AUTH_COOKIE_MAX_AGE_SECONDS
      });
    }
  }

  if (path === "/auth/logout") {
    nextResponse.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
  }

  const contentDisposition = response.headers.get("content-disposition");
  if (contentDisposition) {
    nextResponse.headers.set("content-disposition", contentDisposition);
  }

  return nextResponse;
}
