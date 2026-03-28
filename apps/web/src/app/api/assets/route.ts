import { createAsset, listAssets, parseAssetFilters } from "../_lib/mock-data";
import { handleRoute } from "../_lib/route-utils";

export async function GET(request: Request) {
  return handleRoute(async () => {
    const { searchParams } = new URL(request.url);
    return listAssets(parseAssetFilters(searchParams));
  });
}

export async function POST(request: Request) {
  return handleRoute(async () => {
    const body = (await request.json()) as {
      assetCode: string;
      assetTypeId: string;
      brand: string;
      model: string;
      serialNumber: string;
      specification?: string | null;
      purchaseDate?: string | null;
      status: "ACTIVE" | "IN_REPAIR" | "IN_STORE" | "TEMPORARY_REPLACEMENT" | "DAMAGED" | "RETIRED";
      currentLocation?: string | null;
      notes?: string | null;
    };

    return createAsset({
      assetCode: body.assetCode,
      assetTypeId: body.assetTypeId,
      brand: body.brand,
      model: body.model,
      serialNumber: body.serialNumber,
      specification: body.specification ?? null,
      purchaseDate: body.purchaseDate ?? null,
      status: body.status,
      currentLocation: body.currentLocation ?? null,
      notes: body.notes ?? null
    });
  });
}
