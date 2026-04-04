import { createReplacement, listReplacements } from "../_lib/mock-data";
import { handleRoute } from "../_lib/route-utils";

export async function GET() {
  return handleRoute(async () => listReplacements());
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const body = (await request.json()) as {
      originalAssetId: string;
      replacementAssetId: string;
      replacementType: "TEMPORARY" | "PERMANENT";
      replacementDate: string;
      reason: "DUE_TO_ONGOING_REPAIR" | "NOT_WORKING" | "OTHER";
      customReason?: string | null;
      workstationId?: string | null;
    };

    return createReplacement(body);
  });
}
