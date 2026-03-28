import { Router } from "express";
import { assetPayloadSchema, assetQuerySchema } from "../shared/inventory.schemas.js";
import { inventoryRepository } from "../shared/inventory.repository.js";

export const assetsRouter = Router();

assetsRouter.get("/", async (req, res, next) => {
  try {
    const filters = assetQuerySchema.parse(req.query);
    const assets = await inventoryRepository.listAssets(filters);
    res.json(assets);
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/types/all", async (_req, res, next) => {
  try {
    const assetTypes = await inventoryRepository.listAssetTypes();
    res.json(assetTypes);
  } catch (error) {
    next(error);
  }
});

assetsRouter.get("/:id", async (req, res, next) => {
  try {
    const asset = await inventoryRepository.getAssetById(req.params.id);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.post("/", async (req, res, next) => {
  try {
    const payload = assetPayloadSchema.parse(req.body);
    const asset = await inventoryRepository.createAsset(payload);
    res.status(201).json(asset);
  } catch (error) {
    next(error);
  }
});

assetsRouter.put("/:id", async (req, res, next) => {
  try {
    const payload = assetPayloadSchema.parse(req.body);
    const asset = await inventoryRepository.updateAsset(req.params.id, payload);
    res.json(asset);
  } catch (error) {
    next(error);
  }
});
