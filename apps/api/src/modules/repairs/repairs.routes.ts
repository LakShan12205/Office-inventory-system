import { Router } from "express";
import {
  repairPayloadSchema,
  repairQuerySchema,
  repairUpdateSchema
} from "../shared/inventory.schemas.js";
import { inventoryRepository } from "../shared/inventory.repository.js";

export const repairsRouter = Router();

repairsRouter.get("/", async (req, res, next) => {
  try {
    const filters = repairQuerySchema.parse(req.query);
    const repairs = await inventoryRepository.listRepairs(filters);
    res.json(repairs);
  } catch (error) {
    next(error);
  }
});

repairsRouter.post("/", async (req, res, next) => {
  try {
    const payload = repairPayloadSchema.parse(req.body);
    const repair = await inventoryRepository.createRepair(payload);
    res.status(201).json(repair);
  } catch (error) {
    next(error);
  }
});

repairsRouter.put("/:id", async (req, res, next) => {
  try {
    const payload = repairUpdateSchema.parse(req.body);
    const repair = await inventoryRepository.updateRepair(req.params.id, payload);
    res.json(repair);
  } catch (error) {
    next(error);
  }
});
