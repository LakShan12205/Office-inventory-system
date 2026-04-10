import { Router } from "express";
import { replacementPayloadSchema } from "../shared/inventory.schemas.js";
import * as inventoryService from "../shared/inventory.service.js";

export const replacementsRouter = Router();

replacementsRouter.get("/", async (_req, res, next) => {
  try {
    const replacements = await inventoryService.listReplacements();
    res.json(replacements);
  } catch (error) {
    next(error);
  }
});

replacementsRouter.post("/", async (req, res, next) => {
  try {
    const payload = replacementPayloadSchema.parse(req.body);
    const replacement = await inventoryService.createReplacement(payload);
    res.status(201).json(replacement);
  } catch (error) {
    next(error);
  }
});
