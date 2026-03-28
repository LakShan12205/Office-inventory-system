import { inventoryRepository } from "../../../../../../api/src/modules/shared/inventory.repository";
import { workstationPayloadSchema } from "../../../../../../api/src/modules/shared/inventory.schemas";
import { handleRoute } from "../../_lib/route-utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    return inventoryRepository.getWorkstationById(id);
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    const payload = workstationPayloadSchema.parse(await request.json());
    return inventoryRepository.updateWorkstation(id, payload);
  });
}
