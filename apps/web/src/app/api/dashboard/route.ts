import { inventoryRepository } from "../../../../../api/src/modules/shared/inventory.repository";
import { handleRoute } from "../_lib/route-utils";

export async function GET() {
  return handleRoute(() => inventoryRepository.getDashboardData());
}
