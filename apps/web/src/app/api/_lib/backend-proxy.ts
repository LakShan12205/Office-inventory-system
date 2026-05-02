import { NextResponse } from "next/server";

function normalizeApiBase(url: string) {
  return url.endsWith("/api") ? url : `${url}/api`;
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

  if (cookie) {
    headers.set("cookie", cookie);
  }

  if (authorization) {
    headers.set("authorization", authorization);
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
  const nextResponse = new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json"
    }
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  const contentDisposition = response.headers.get("content-disposition");
  if (contentDisposition) {
    nextResponse.headers.set("content-disposition", contentDisposition);
  }

  return nextResponse;
}
