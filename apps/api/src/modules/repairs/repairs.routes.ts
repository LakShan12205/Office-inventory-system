import { Router } from "express";
import {
  repairPayloadSchema,
  repairQuerySchema,
  repairReturnSchema,
  repairUpdateSchema
} from "../shared/inventory.schemas.js";
import * as inventoryService from "../shared/inventory.service.js";

export const repairsRouter = Router();

type CreateRepairPayload = Parameters<typeof inventoryService.createRepair>[0];
type UpdateRepairPayload = Parameters<typeof inventoryService.updateRepair>[1];
type ReturnRepairPayload = Parameters<typeof inventoryService.returnRepair>[1];

function toCreateRepairPayload(input: ReturnType<typeof repairPayloadSchema.parse>): CreateRepairPayload {
  if (!input.assetId || !input.reportedDate || !input.faultDescription || !input.repairType) {
    throw new Error("Missing required repair fields");
  }

  return {
    workstationId: input.workstationId,
    assetId: input.assetId,
    reportedDate: input.reportedDate,
    faultDescription: input.faultDescription,
    sentTo: input.sentTo,
    repairType: input.repairType,
    sentDate: input.sentDate,
    expectedReturnDate: input.expectedReturnDate,
    status: input.status,
    notes: input.notes,
    replacementAssetId: input.replacementAssetId,
    replacementNotes: input.replacementNotes
  };
}

function toUpdateRepairPayload(input: ReturnType<typeof repairUpdateSchema.parse>): UpdateRepairPayload {
  return {
    workstationId: input.workstationId,
    assetId: input.assetId,
    reportedDate: input.reportedDate,
    faultDescription: input.faultDescription,
    sentTo: input.sentTo,
    repairType: input.repairType,
    sentDate: input.sentDate,
    expectedReturnDate: input.expectedReturnDate,
    status: input.status,
    notes: input.notes,
    replacementAssetId: input.replacementAssetId,
    replacementNotes: input.replacementNotes
  } as UpdateRepairPayload;
}

function toReturnRepairPayload(input: ReturnType<typeof repairReturnSchema.parse>): ReturnRepairPayload {
  if (!input.action || !input.repairedBy) {
    throw new Error("Action and repairedBy are required");
  }

  return {
    action: input.action,
    repairedBy: input.repairedBy,
    notes: input.notes
  };
}

repairsRouter.get("/", async (req, res, next) => {
  try {
    const filters = repairQuerySchema.parse(req.query);
    const repairs = await inventoryService.listRepairs(filters);
    res.json(repairs);
  } catch (error) {
    next(error);
  }
});

repairsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = repairPayloadSchema.parse(req.body);
    const payload = toCreateRepairPayload(parsed);
    const repair = await inventoryService.createRepair(payload);
    res.status(201).json(repair);
  } catch (error) {
    next(error);
  }
});

repairsRouter.put("/:id", async (req, res, next) => {
  try {
    const parsed = repairUpdateSchema.parse(req.body);
    const payload = toUpdateRepairPayload(parsed);
    const repair = await inventoryService.updateRepair(req.params.id, payload);
    res.json(repair);
  } catch (error) {
    next(error);
  }
});

repairsRouter.post("/:id/return", async (req, res, next) => {
  try {
    const parsed = repairReturnSchema.parse(req.body);
    const payload = toReturnRepairPayload(parsed);
    const repair = await inventoryService.returnRepair(req.params.id, payload);
    res.json(repair);
  } catch (error) {
    next(error);
  }
});