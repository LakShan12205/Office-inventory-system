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
  init?: { method?: string; body?: string }
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

  if (cookie) {
    headers.set("cookie", cookie);
  }

  if (contentType && method !== "GET" && method !== "HEAD") {
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
    (method === "GET" || method === "HEAD" ? undefined : await request.text());

  const response = await fetch(backendUrl.toString(), {
    method,
    cache: "no-store",
    credentials: "include",
    headers,
    body
  });

  const text = await response.text();
  const nextResponse = new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json"
    }
  });

  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    nextResponse.headers.set("set-cookie", setCookie);
  }

  return nextResponse;
}
