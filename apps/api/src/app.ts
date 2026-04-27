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

export const app = express();

const allowedOrigins = [
  env.NEXT_PUBLIC_SITE_URL,
  env.SITE_URL,
  env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null,
  "http://localhost:3000"
].filter(Boolean) as string[];

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const isAllowed =
        allowedOrigins.includes(origin) || origin.endsWith(".vercel.app");

      if (isAllowed) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
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

app.get("/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "office-inventory-api",
    environment: env.NODE_ENV,
    useMockData: env.USE_MOCK_DATA
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
app.use(
  "/api/dashboard",
  requireAuth,
  requirePasswordChangeResolved,
  requireTrustedOrigin,
  dashboardRouter
);
app.use(
  "/api/workstations",
  requireAuth,
  requirePasswordChangeResolved,
  requireTrustedOrigin,
  workstationsRouter
);
app.use(
  "/api/assets",
  requireAuth,
  requirePasswordChangeResolved,
  requireTrustedOrigin,
  assetsRouter
);
app.use(
  "/api/repairs",
  requireAuth,
  requirePasswordChangeResolved,
  requireTrustedOrigin,
  repairsRouter
);
app.use(
  "/api/replacements",
  requireAuth,
  requirePasswordChangeResolved,
  requireTrustedOrigin,
  replacementsRouter
);
app.use(
  "/api/alerts",
  requireAuth,
  requirePasswordChangeResolved,
  requireTrustedOrigin,
  alertsRouter
);

app.use(errorHandler);

export default app;
