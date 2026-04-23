import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "office_inventory_auth";
const PUBLIC_PATHS = new Set(["/login", "/request-access"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||import type { Request, Response, NextFunction } from "express";
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
  const isTrusted = trustedOrigins.some((trustedOrigin) => source.startsWith(trustedOrigin));

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
    pathname.includes(".");

  if (isStaticAsset) {
    return NextResponse.next();
  }

  const hasAuthCookie = Boolean(request.cookies.get(AUTH_COOKIE_NAME)?.value);
  const isPublicPath = PUBLIC_PATHS.has(pathname);

  if (!hasAuthCookie && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasAuthCookie && isPublicPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api).*)"]
};
