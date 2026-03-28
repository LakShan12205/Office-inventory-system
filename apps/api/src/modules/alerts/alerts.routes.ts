import { Router } from "express";
import { alertUpdateSchema, alertsQuerySchema } from "../shared/inventory.schemas.js";
import { inventoryRepository } from "../shared/inventory.repository.js";

export const alertsRouter = Router();

alertsRouter.get("/", async (req, res, next) => {
  try {
    const filters = alertsQuerySchema.parse(req.query);
    const alerts = await inventoryRepository.listAlerts(filters);
    res.json(alerts);
  } catch (error) {
    next(error);
  }
});

alertsRouter.put("/:id", async (req, res, next) => {
  try {
    const payload = alertUpdateSchema.parse(req.body);
    const alert = await inventoryRepository.updateAlert(req.params.id, payload.status, payload.resolvedAt);
    res.json(alert);
  } catch (error) {
    next(error);
  }
});
