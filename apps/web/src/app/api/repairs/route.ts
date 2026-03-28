import { inventoryRepository } from "../../../../../api/src/modules/shared/inventory.repository";
import { repairPayloadSchema, repairQuerySchema } from "../../../../../api/src/modules/shared/inventory.schemas";
import { handleRoute } from "../_lib/route-utils";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    const filters = repairQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    return inventoryRepository.listRepairs(filters);
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const payload = repairPayloadSchema.parse(await request.json());
    return inventoryRepository.createRepair(payload);
  });
}
