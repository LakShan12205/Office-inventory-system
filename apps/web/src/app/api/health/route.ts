import { proxyToBackend } from "../_lib/backend-proxy";

export async function GET(request: Request) {
  return proxyToBackend(request, "/health");
}
