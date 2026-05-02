import { proxyToBackend } from "../../../../_lib/backend-proxy";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyToBackend(request, `/assets/${id}/invoice/view`);
}
