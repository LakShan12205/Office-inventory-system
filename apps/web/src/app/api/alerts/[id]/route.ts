import { proxyToBackend } from "../../_lib/backend-proxy";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyToBackend(request, `/alerts/${id}`);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyToBackend(request, `/alerts/${id}`, { method: "PUT" });
}
