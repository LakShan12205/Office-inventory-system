import { proxyToBackend } from "../../../_lib/backend-proxy";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  return proxyToBackend(request, `/access-requests/${id}/reject`);
}
