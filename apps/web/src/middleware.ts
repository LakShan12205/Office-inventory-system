import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "office_inventory_auth";
const PUBLIC_PATHS = new Set(["/login", "/request-access"]);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isStaticAsset =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
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
