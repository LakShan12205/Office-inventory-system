import { NextRequest, NextResponse } from "next/server";

function normalizeApiBase(url: string) {
  return url.endsWith("/api") ? url : `${url}/api`;
}

export async function GET(request: NextRequest) {
  const backendBase = process.env.NEXT_PUBLIC_API_URL;

  if (!backendBase) {
    return NextResponse.json(
      { error: { message: "NEXT_PUBLIC_API_URL is not configured", status: 500 } },
      { status: 500 }
    );
  }

  const cookie = request.headers.get("cookie") ?? "";

  try {
    const url = new URL(request.url);
    const query = url.search; // preserve filters/search params

    const response = await fetch(
      `${normalizeApiBase(backendBase)}/workstations${query}`,
      {
        method: "GET",
        headers: {
          cookie
        },
        cache: "no-store"
      }
    );

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json"
      }
    });
  } catch (error) {
    console.error("Workstations proxy error:", error);

    return NextResponse.json(
      { error: { message: "Unable to fetch workstations.", status: 502 } },
      { status: 502 }
    );
  }
}