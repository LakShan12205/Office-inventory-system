import { getDashboardData } from "../_lib/mock-data";
import { handleRoute } from "../_lib/route-utils";

export async function GET() {
  return handleRoute(async () => getDashboardData());
}
