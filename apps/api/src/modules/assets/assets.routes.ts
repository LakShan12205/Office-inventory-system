import { Router } from "express";
import { assetPayloadSchema, assetQuerySchema } from "../shared/inventory.schemas.js";
import * as inventoryService from "../shared/inventory.service.js";
import { requireAdmin } from "../../middleware/auth.js";

export const assetsRouter = Router();

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
    const payload = assetPayloadSchema.parse(req.body);
    const asset = await inventoryService.createAsset(payload);
    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.put("/:id", async (req, res, next) => {
  try {
    const payload = assetPayloadSchema.parse(req.body);
    const asset = await inventoryService.updateAsset(req.params.id, payload);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.patch("/:id", async (req, res, next) => {
  try {
    const payload = assetPayloadSchema.parse(req.body);
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
