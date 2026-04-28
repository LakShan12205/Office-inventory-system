import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";

import { requireAuth, requirePasswordChangeResolved } from "./middleware/auth.js";
import { requireTrustedOrigin } from "./middleware/csrf.js";
import { errorHandler } from "./middleware/error-handler.js";

import { alertsRouter } from "./modules/alerts/alerts.routes.js";
import { assetsRouter } from "./modules/assets/assets.routes.js";
import { accessRequestsRouter, authRouter } from "./modules/auth/auth.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { repairsRouter } from "./modules/repairs/repairs.routes.js";
import { replacementsRouter } from "./modules/replacements/replacements.routes.js";
import { workstationsRouter } from "./modules/workstations/workstations.routes.js";

const app = express();

/**
 * 🔐 Security
 */
app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

/**
 * 🌐 CORS
 */
const allowedOrigins = [
  env.NEXT_PUBLIC_SITE_URL,
  env.SITE_URL,
  env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null,
  "http://localhost:3000"
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);

/**
 * 🧩 Middlewares
 */
app.use(express.json());
app.use(morgan("dev"));

/**
 * ✅ PUBLIC ROUTES
 */
app.use("/api/auth", requireTrustedOrigin, authRouter);
app.use("/api/access-requests", requireTrustedOrigin, accessRequestsRouter);

/**
 * 🔐 PROTECTED ROUTES
 */
app.use("/api/dashboard", requireAuth, requirePasswordChangeResolved, dashboardRouter);
app.use("/api/workstations", requireAuth, requirePasswordChangeResolved, workstationsRouter);
app.use("/api/assets", requireAuth, requirePasswordChangeResolved, assetsRouter);
app.use("/api/repairs", requireAuth, requirePasswordChangeResolved, repairsRouter);
app.use("/api/replacements", requireAuth, requirePasswordChangeResolved, replacementsRouter);
app.use("/api/alerts", requireAuth, requirePasswordChangeResolved, alertsRouter);

/**
 * ❌ 404
 */
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

/**
 * ⚠️ Error handler
 */
app.use(errorHandler);

export default app;