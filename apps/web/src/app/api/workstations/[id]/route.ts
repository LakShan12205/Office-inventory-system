import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const backendBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  const backendUrl = new URL(`${backendBase.replace(/\/$/, "")}/workstations/${id}`);

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
