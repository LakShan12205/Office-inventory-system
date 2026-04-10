import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const backendBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";
  const backendUrl = `${backendBase.replace(/\/$/, "")}/workstations/${id}/assignments`;
  const body = await request.text();

  const response = await fetch(backendUrl, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      cookie: request.headers.get("cookie") ?? ""
    },
    body
  });

  const text = await response.text();

  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type": response.headers.get("content-type") ?? "application/json"
    }
  });
}
