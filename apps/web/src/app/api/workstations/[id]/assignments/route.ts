import { inventoryRepository } from "../../../../../../../api/src/modules/shared/inventory.repository";
import { workstationAssignmentPayloadSchema } from "../../../../../../../api/src/modules/shared/inventory.schemas";
import { handleRoute } from "../../../_lib/route-utils";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    const payload = workstationAssignmentPayloadSchema.parse(await request.json());
    return inventoryRepository.createWorkstationAssignment(id, payload);
  });
}
