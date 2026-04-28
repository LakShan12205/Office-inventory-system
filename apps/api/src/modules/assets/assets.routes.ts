import { Router } from "express";
import { assetPayloadSchema, assetQuerySchema } from "../shared/inventory.schemas.js";
import * as inventoryService from "../shared/inventory.service.js";
import { requireAdmin } from "../../middleware/auth.js";

export const assetsRouter = Router();

type CreateAssetPayload = Parameters<typeof inventoryService.createAsset>[0];
type UpdateAssetPayload = Parameters<typeof inventoryService.updateAsset>[1];

function toCreateAssetPayload(input: ReturnType<typeof assetPayloadSchema.parse>): CreateAssetPayload {
  if (
    !input.assetCode ||
    !input.assetTypeId ||
    !input.brand ||
    !input.model ||
    !input.serialNumber ||
    !input.status
  ) {
    throw new Error("Missing required asset fields");
  }

  return {
    assetCode: input.assetCode,
    assetTypeId: input.assetTypeId,
    brand: input.brand,
    model: input.model,
    serialNumber: input.serialNumber,
    specification: input.specification,
    purchaseDate: input.purchaseDate,
    warrantyExpiryDate: input.warrantyExpiryDate,
    status: input.status,
    currentLocation: input.currentLocation,
    assignment:
      input.currentLocation && /^WS-\d{2}$/i.test(input.currentLocation)
        ? {
            workstationCode: input.currentLocation,
            status: "ACTIVE"
          }
        : undefined,
    notes: input.notes
  };
}

function toUpdateAssetPayload(input: ReturnType<typeof assetPayloadSchema.parse>): UpdateAssetPayload {
  return {
    assetCode: input.assetCode,
    assetTypeId: input.assetTypeId,
    brand: input.brand,
    model: input.model,
    serialNumber: input.serialNumber,
    specification: input.specification,
    purchaseDate: input.purchaseDate,
    warrantyExpiryDate: input.warrantyExpiryDate,
    status: input.status,
    currentLocation: input.currentLocation,
    assignment:
      input.currentLocation && /^WS-\d{2}$/i.test(input.currentLocation)
        ? {
            workstationCode: input.currentLocation,
            status: "ACTIVE"
          }
        : undefined,
    notes: input.notes
  } as UpdateAssetPayload;
}

assetsRouter.get("/", async (req, res, next) => {
  try {
    const filters = assetQuerySchema.parse(req.query);
    const assets = await inventoryService.listAssets(filters);
    res.json(assets);
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/types/all", async (_req, res, next) => {
  try {
    const assetTypes = await inventoryService.listAssetTypes();
    res.json(assetTypes);
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/:id", async (req, res, next) => {
  try {
    const asset = await inventoryService.getAssetById(req.params.id);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = assetPayloadSchema.parse(req.body);
    const payload = toCreateAssetPayload(parsed);
    const asset = await inventoryService.createAsset(payload);
    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.put("/:id", async (req, res, next) => {
  try {
    const parsed = assetPayloadSchema.parse(req.body);
    const payload = toCreateAssetPayload(parsed);
    const asset = await inventoryService.updateAsset(req.params.id, payload);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.patch("/:id", async (req, res, next) => {
  try {
    const parsed = assetPayloadSchema.parse(req.body);
    const payload = toUpdateAssetPayload(parsed);
    const asset = await inventoryService.updateAsset(req.params.id, payload);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.post("/:id/archive", async (req, res, next) => {
  try {
    const asset = await inventoryService.archiveAsset(req.params.id);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.delete("/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = await inventoryService.deleteAsset(String(req.params.id));
    res.json(result);
  } catch (error) {
    next(error);
  }
});

assetsRouter.delete("/", requireAdmin, async (_req, res, next) => {
  try {
    const result = await inventoryService.deleteAllRemovableAssets();
    res.json(result);
  } catch (error) {
    next(error);
  }
});
