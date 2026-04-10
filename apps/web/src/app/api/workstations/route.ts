import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const backendBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  const backendUrl = new URL(`${backendBase.replace(/\/$/, "")}/workstations`);
  const incomingUrl = new URL(request.url);

  incomingUrl.searchParams.forEach((value, key) => {
    backendUrl.searchParams.append(key, value);
  });

  const response = await fetch(backendUrl.toString(), {
    cache: "no-store",
    credentials: "include",
    headers: {
      cookie: request.headers.get("cookie") ?? ""
    }
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
