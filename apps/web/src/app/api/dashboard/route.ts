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
    const response = await fetch(`${normalizeApiBase(backendBase)}/dashboard`, {
      method: "GET",
      headers: {
        cookie
      },
      cache: "no-store"
    });

    const text = await response.text();

    return new NextResponse(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json"
      }
    });
  } catch {
    return NextResponse.json(
      { error: { message: "Unable to reach dashboard service.", status: 502 } },
      { status: 502 }
    );
  }
}