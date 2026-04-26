import type { Request, Response, NextFunction } from "express";
import { env } from "../config/env.js";

const trustedOrigins = [
  env.SITE_URL,
  "http://localhost:3000",
  "https://office-inventory-system-web-dntb.vercel.app"
].filter(Boolean) as string[];

export function requireTrustedOrigin(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin;
  const referer = req.headers.referer;

  if (!origin && !referer) {
    return next();
  }

  const source = origin ?? referer ?? "";
  const isTrusted = trustedOrigins.some((trustedOrigin) =>
    source.startsWith(trustedOrigin)
  );

  if (!isTrusted) {
    return res.status(403).json({
      error: {
        message: "Untrusted request origin.",
        status: 403
      }
    });
  }

  return next();
}