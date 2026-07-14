import { NextResponse, type NextRequest } from "next/server";

const AUTH_COOKIE_NAME = "office_inventory_auth";
const PUBLIC_ROUTES = ["/login", "/request-access"];

type JwtHeader = {
  alg?: string;
  typ?: string;
};

type JwtPayload = {
  exp?: number;
};

function base64UrlToBytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function decodeJwtPart<T>(value: string): T | null {
  try {
    const decoded = new TextDecoder().decode(base64UrlToBytes(value));
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left[index] ^ right[index];
  }

  return mismatch === 0;
}

async function isValidAuthToken(token?: string) {
  const secret = process.env.JWT_SECRET ?? process.env.AUTH_SECRET;

  if (!token || !secret) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = decodeJwtPart<JwtHeader>(encodedHeader);
  const payload = decodeJwtPart<JwtPayload>(encodedPayload);

  if (header?.alg !== "HS256" || !payload) {
    return false;
  }

  if (typeof payload.exp === "number" && payload.exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
    );

    return constantTimeEqual(new Uint8Array(signature), base64UrlToBytes(encodedSignature));
  } catch {
    return false;
  }
}

function redirectToLogin(request: NextRequest) {
  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";

  const response = NextResponse.redirect(loginUrl);
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0
  });

  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.png" ||
    pathname === "/logo.png" ||
    pathname === "/background.png"
  ) {
    return NextResponse.next();
  }

  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const hasValidToken = await isValidAuthToken(token);

  if (!hasValidToken && !isPublicRoute) {
    return redirectToLogin(request);
  }

  if (!hasValidToken && token) {
    const response = NextResponse.next();
    response.cookies.set(AUTH_COOKIE_NAME, "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
