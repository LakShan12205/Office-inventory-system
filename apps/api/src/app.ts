import cors from "cors";
import express from "express";
import { helmet } from "helmet";
import morgan from "morgan";
import { errorHandler } from "./middleware/error-handler.js";
import { requireAuth, requirePasswordChangeResolved } from "./middleware/auth.js";
import { requireTrustedOrigin } from "./middleware/csrf.js";
import { alertsRouter } from "./modules/alerts/alerts.routes.js";
import { assetsRouter } from "./modules/assets/assets.routes.js";
import { accessRequestsRouter, authRouter } from "./modules/auth/auth.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { repairsRouter } from "./modules/repairs/repairs.routes.js";
import { replacementsRouter } from "./modules/replacements/replacements.routes.js";
import { workstationsRouter } from "./modules/workstations/workstations.routes.js";
import { env } from "./config/env.js";

export const app = express();

const allowedOrigins = [
  env.NEXT_PUBLIC_SITE_URL,
  process.env.NODE_ENV === "production" ? null : "http://localhost:3000"
].filter(Boolean) as string[];

app.use(helmet());
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/access-requests", accessRequestsRouter);
app.use("/api/dashboard", requireAuth, requirePasswordChangeResolved, requireTrustedOrigin, dashboardRouter);
app.use("/api/workstations", requireAuth, requirePasswordChangeResolved, requireTrustedOrigin, workstationsRouter);
app.use("/api/assets", requireAuth, requirePasswordChangeResolved, requireTrustedOrigin, assetsRouter);
app.use("/api/repairs", requireAuth, requirePasswordChangeResolved, requireTrustedOrigin, repairsRouter);
app.use("/api/replacements", requireAuth, requirePasswordChangeResolved, requireTrustedOrigin, replacementsRouter);
app.use("/api/alerts", requireAuth, requirePasswordChangeResolved, requireTrustedOrigin, alertsRouter);

app.use(errorHandler);