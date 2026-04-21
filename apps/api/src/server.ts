import cors from "cors";
import express from "express";
import { createRequire } from "module";
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

const require = createRequire(import.meta.url);
const helmet = require("helmet");

export const app = express();

/**
 * 🔥 SECURITY + CORS FIX
 */
app.use(helmet());

const allowedOrigins = [
  env.NEXT_PUBLIC_SITE_URL,
  "http://localhost:3000",

  // production main domain
  "https://office-inventory-system-web-3bxn.vercel.app",

  // preview / deployment domains
  "https://office-inventory-system-web-3bxn-lf31r2o2b.vercel.app",
  "https://office-inventory-system-web-3-git-ec9d14-kavindu12205s-projects.vercel.app"
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like Postman or server-side)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error("❌ CORS blocked:", origin);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true
  })
);

app.use(express.json());
app.use(morgan("dev"));

/**
 * ✅ HEALTH CHECK
 */
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * ✅ ROUTES
 */
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

/**
 * ❌ ERROR HANDLER
 */
app.use(errorHandler);

export default app;