import { proxyToBackend } from "../_lib/backend-proxy";

export async function GET(request: Request) {
  return proxyToBackend(request, "/assets");
}

export async function POST(request: Request) {
  return proxyToBackend(request, "/assets");
}

export async function DELETE(request: Request) {
  return proxyToBackend(request, "/assets");
}
