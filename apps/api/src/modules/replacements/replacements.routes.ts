import { Router } from "express";
import { replacementPayloadSchema } from "../shared/inventory.schemas.js";
import * as inventoryService from "../shared/inventory.service.js";

export const replacementsRouter = Router();

type CreateReplacementPayload = Parameters<typeof inventoryService.createReplacement>[0];

function toCreateReplacementPayload(
  input: ReturnType<typeof replacementPayloadSchema.parse>
): CreateReplacementPayload {
  if (
    !input.originalAssetId ||
    !input.replacementAssetId ||
    !input.replacementType ||
    !input.replacementDate ||
    !input.reason
  ) {
    throw new Error("Missing required replacement fields");
  }

  return {
    workstationId: input.workstationId,
    originalAssetId: input.originalAssetId,
    replacementAssetId: input.replacementAssetId,
    replacementDate: input.replacementDate,
    replacementType: input.replacementType,
    reason: input.reason,
    customReason: input.customReason
  };
}

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
    const parsed = replacementPayloadSchema.parse(req.body);
    const payload = toCreateReplacementPayload(parsed);
    const replacement = await inventoryService.createReplacement(payload);
    res.status(201).json(replacement);
  } catch (error) {
    next(error);
  }
});