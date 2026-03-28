import { inventoryRepository } from "../../../../../../api/src/modules/shared/inventory.repository";
import { assetPayloadSchema } from "../../../../../../api/src/modules/shared/inventory.schemas";
import { handleRoute } from "../../_lib/route-utils";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    return inventoryRepository.getAssetById(id);
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRoute(async () => {
    const { id } = await context.params;
    const payload = assetPayloadSchema.parse(await request.json());
    return inventoryRepository.updateAsset(id, payload);
  });
}
