import { listWorkstations, parseWorkstationFilters } from "../_lib/mock-data";
import { handleRoute } from "../_lib/route-utils";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    return listWorkstations(parseWorkstationFilters(searchParams));
  });
}
