import { Router } from "express";
import {
  workstationAssignmentPayloadSchema,
  workstationPayloadSchema,
  workstationQuerySchema
} from "../shared/inventory.schemas.js";
import * as inventoryService from "../shared/inventory.service.js";

export const workstationsRouter = Router();

type CreateWorkstationPayload = Parameters<typeof inventoryService.createWorkstation>[0];
type UpdateWorkstationPayload = Parameters<typeof inventoryService.updateWorkstation>[1];
type CreateAssignmentPayload = Parameters<typeof inventoryService.createWorkstationAssignment>[1];

function toWorkstationPayload(
  input: ReturnType<typeof workstationPayloadSchema.parse>
): CreateWorkstationPayload {
  if (!input.code || !input.name || !input.location || !input.status) {
    throw new Error("Missing required workstation fields");
  }

  return {
    code: input.code,
    name: input.name,
    location: input.location,
    status: input.status,
    notes: input.notes
  };
}

function toAssignmentPayload(
  input: ReturnType<typeof workstationAssignmentPayloadSchema.parse>
): CreateAssignmentPayload {
  if (!input.assetId || !input.assignmentType) {
    throw new Error("Missing required assignment fields");
  }

  return {
    assetId: input.assetId,
    assignmentType: input.assignmentType,
    assignedDate: input.assignedDate,
    notes: input.notes
  };
}

workstationsRouter.get("/", async (req, res, next) => {
  try {
    const filters = workstationQuerySchema.parse(req.query);
    const workstations = await inventoryService.listWorkstations(filters);
    res.json(workstations);
  } catch (error) {
    next(error);
  }
});

workstationsRouter.get("/:id", async (req, res, next) => {
  try {
    const workstation = await inventoryService.getWorkstationById(req.params.id);
    res.json(workstation);
  } catch (error) {
    next(error);
  }
});

workstationsRouter.post("/", async (req, res, next) => {
  try {
    const parsed = workstationPayloadSchema.parse(req.body);
    const payload = toWorkstationPayload(parsed);
    const workstation = await inventoryService.createWorkstation(payload);
    res.status(201).json(workstation);
  } catch (error) {
    next(error);
  }
});

workstationsRouter.put("/:id", async (req, res, next) => {
  try {
    const parsed = workstationPayloadSchema.parse(req.body);
    const payload: UpdateWorkstationPayload = toWorkstationPayload(parsed);
    const workstation = await inventoryService.updateWorkstation(req.params.id, payload);
    res.json(workstation);
  } catch (error) {
    next(error);
  }
});

workstationsRouter.post("/:id/assignments", async (req, res, next) => {
  try {
    const parsed = workstationAssignmentPayloadSchema.parse(req.body);
    const payload = toAssignmentPayload(parsed);
    const assignment = await inventoryService.createWorkstationAssignment(req.params.id, payload);
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
});