import { Router } from "express";
import {
  workstationAssignmentPayloadSchema,
  workstationPayloadSchema,
  workstationQuerySchema
} from "../shared/inventory.schemas.js";
import * as inventoryService from "../shared/inventory.service.js";

export const workstationsRouter = Router();

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
    const payload = workstationPayloadSchema.parse(req.body);
    const workstation = await inventoryService.createWorkstation(payload);
    res.status(201).json(workstation);
  } catch (error) {
    next(error);
  }
});

workstationsRouter.put("/:id", async (req, res, next) => {
  try {
    const payload = workstationPayloadSchema.parse(req.body);
    const workstation = await inventoryService.updateWorkstation(req.params.id, payload);
    res.json(workstation);
  } catch (error) {
    next(error);
  }
});

workstationsRouter.post("/:id/assignments", async (req, res, next) => {
  try {
    const payload = workstationAssignmentPayloadSchema.parse(req.body);
    const assignment = await inventoryService.createWorkstationAssignment(req.params.id, payload);
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
});
