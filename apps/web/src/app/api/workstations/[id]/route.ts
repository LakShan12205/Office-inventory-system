import { getWorkstationById } from "../../_lib/mock-data";
import { handleRoute } from "../../_lib/route-utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    return getWorkstationById(id);
  });
}
