import { Router } from "express";
import * as inventoryService from "../shared/inventory.service.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", async (_req, res, next) => {
  try {
    const data = await inventoryService.getDashboardData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});
