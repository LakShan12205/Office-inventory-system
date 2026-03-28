import { inventoryRepository } from "../../../../../api/src/modules/shared/inventory.repository";
import { alertsQuerySchema } from "../../../../../api/src/modules/shared/inventory.schemas";
import { handleRoute } from "../_lib/route-utils";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    const filters = alertsQuerySchema.parse(Object.fromEntries(searchParams.entries()));
    return inventoryRepository.listAlerts(filters);
  });
}
