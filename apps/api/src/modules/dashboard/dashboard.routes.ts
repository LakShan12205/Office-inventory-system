import { Router } from "express";
import { inventoryRepository } from "../shared/inventory.repository.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (_req, res, next) => {
  try {
    const data = await inventoryRepository.getDashboardData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});
