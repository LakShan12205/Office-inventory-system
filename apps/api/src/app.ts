import cors from "cors";
import express from "express";
import { createRequire } from "module";
import morgan from "morgan";

import { env } from "./config/env.js";
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

const require = createRequire(import.meta.url);
const helmet = require("helmet");

export const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

const allowedOrigins = [
  env.SITE_URL,
  "http://localhost:3000"
].filter(Boolean) as string[];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "office-inventory-api",
    environment: env.NODE_ENV
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "office-inventory-api",
    environment: env.NODE_ENV,
    useMockData: env.USE_MOCK_DATA
  });
});

app.use("/api/auth", authRouter);
app.use("/api/access-requests", accessRequestsRouter);

app.use("/api/dashboard", requireAuth, requirePasswordChangeResolved, dashboardRouter);
app.use("/api/workstations", requireAuth, requirePasswordChangeResolved, workstationsRouter);
app.use("/api/assets", requireAuth, requirePasswordChangeResolved, assetsRouter);
app.use("/api/repairs", requireAuth, requirePasswordChangeResolved, repairsRouter);
app.use("/api/replacements", requireAuth, requirePasswordChangeResolved, replacementsRouter);
app.use("/api/alerts", requireAuth, requirePasswordChangeResolved, alertsRouter);

app.use(errorHandler);


// ... your existing code ends with app.use(errorHandler);

// 👇 COPY-PASTE this at the VERY END
export default async (req, res) => {
  return new Promise((resolve, reject) => {
    app(req, res, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
};