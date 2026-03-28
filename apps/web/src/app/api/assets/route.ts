import { inventoryRepository } from "../../../../../api/src/modules/shared/inventory.repository";
import { assetPayloadSchema, assetQuerySchema } from "../../../../../api/src/modules/shared/inventory.schemas";
import { handleRoute } from "../_lib/route-utils";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    const filters = assetQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    return inventoryRepository.listAssets(filters);
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const payload = assetPayloadSchema.parse(await request.json());
    return inventoryRepository.createAsset(payload);
  });
}
