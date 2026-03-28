import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/error-handler.js";
import { alertsRouter } from "./modules/alerts/alerts.routes.js";
import { assetsRouter } from "./modules/assets/assets.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { repairsRouter } from "./modules/repairs/repairs.routes.js";
import { replacementsRouter } from "./modules/replacements/replacements.routes.js";
import { workstationsRouter } from "./modules/workstations/workstations.routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/dashboard", dashboardRouter);
app.use("/api/workstations", workstationsRouter);
app.use("/api/assets", assetsRouter);
app.use("/api/repairs", repairsRouter);
app.use("/api/replacements", replacementsRouter);
app.use("/api/alerts", alertsRouter);

app.use(errorHandler);
