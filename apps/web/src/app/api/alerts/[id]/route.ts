import { updateAlert } from "../../_lib/mock-data";
import { handleRoute } from "../../_lib/route-utils";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    const body = (await request.json()) as { action?: "read" | "dismiss" };

    if (!body.action || !["read", "dismiss"].includes(body.action)) {
      throw new Error("Invalid alert action");
    }

    return updateAlert(id, body.action);
  });
}
