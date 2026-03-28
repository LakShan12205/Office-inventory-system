import { createRepair, listRepairs, parseRepairFilters } from "../_lib/mock-data";
import { handleRoute } from "../_lib/route-utils";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    return listRepairs(parseRepairFilters(searchParams));
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const body = (await request.json()) as {
      workstationId: string;
      assetId: string;
      reportedDate: string;
      faultDescription: string;
      sentTo?: string | null;
      repairType: "ON_SITE" | "SENT_TO_SHOP";
      sentDate?: string | null;
      expectedReturnDate?: string | null;
      actualReturnDate?: string | null;
      diagnosis?: string | null;
      repairAction?: string | null;
      partsChanged?: string | null;
      cost?: number | null;
      handledBy?: string | null;
      notes?: string | null;
      status: "REPORTED" | "SENT" | "IN_PROGRESS" | "RETURNED" | "CLOSED";
      replacementAssetId?: string | null;
      replacementDate?: string | null;
      replacementReturnDate?: string | null;
      replacementStatus?: "ACTIVE" | "REMOVED" | "PENDING_RESTORE";
      replacementNotes?: string | null;
    };

    return createRepair(body);
  });
}
