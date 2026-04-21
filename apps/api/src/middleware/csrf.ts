import createError from "http-errors";
import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env.js";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getAllowedOrigins() {
  return new Set(
    [
      env.NEXT_PUBLIC_SITE_URL,
      "http://localhost:3000",
      "https://office-inventory-system-web-3bxn.vercel.app",
      "https://office-inventory-system-web-3bxn-lf31r2o2b.vercel.app",
      "https://office-inventory-system-web-3-git-ec9d14-kavindu12205s-projects.vercel.app"
    ]
      .filter(Boolean)
      .map((value) => new URL(value as string).origin)
  );
}

// Lightweight CSRF protection for cookie-authenticated write routes.
// We validate Origin / Referer against the known frontend origin.
export function requireTrustedOrigin(req: Request, _res: Response, next: NextFunction) {
  if (SAFE_METHODS.has(req.method.toUpperCase())) {
    next();
    return;
  }

  const allowedOrigins = getAllowedOrigins();
  const originHeader = req.headers.origin;
  const refererHeader = req.headers.referer;

  const candidateOrigin = (() => {
    if (typeof originHeader === "string" && originHeader.trim()) {
      return originHeader;
    }

    if (typeof refererHeader === "string" && refererHeader.trim()) {
      try {
        return new URL(refererHeader).origin;
      } catch {
        return null;
      }
    }

    return null;
  })();

  if (!candidateOrigin || !allowedOrigins.has(candidateOrigin)) {
    next(createError(403, "Invalid request origin."));
    return;
  }

  next();
}