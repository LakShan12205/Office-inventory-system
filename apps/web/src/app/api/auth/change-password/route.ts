import { proxyToBackend } from "../../_lib/backend-proxy";

export async function POST(request: Request) {
  return proxyToBackend(request, "/auth/change-password");
}
