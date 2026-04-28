import createError from "http-errors";
import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "office_inventory_auth";

type AuthTokenPayload = {
  sub: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
  tokenVersion: number;
};

function parseBearerToken(authorizationHeader?: string | null) {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (!scheme || !token || scheme.toLowerCase() !== "bearer") {
    return null;
  }

  return token.trim() || null;
}

function parseCookies(cookieHeader?: string) {
  if (!cookieHeader) {
    return new Map<string, string>();
  }

  return new Map(
    cookieHeader
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) => {
        const separatorIndex = entry.indexOf("=");
        const key = separatorIndex >= 0 ? entry.slice(0, separatorIndex) : entry;
        const value = separatorIndex >= 0 ? entry.slice(separatorIndex + 1) : "";
        return [key, decodeURIComponent(value)] as const;
      })
  );
}

function getJwtSecret() {
  const jwtSecret = process.env.JWT_SECRET ?? env.AUTH_SECRET;

  if (!jwtSecret) {
    throw createError(500, "JWT secret is missing.");
  }

  return jwtSecret;
}

export function getAuthCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 1000 * 60 * 60 * 12,
    domain: env.AUTH_COOKIE_DOMAIN
  };
}

export function signAuthToken(input: {
  id: string;
  username: string;
  role: string;
  mustChangePassword: boolean;
  tokenVersion: number;
}) {
  return jwt.sign(
    {
      sub: input.id,
      username: input.username,
      role: input.role,
      mustChangePassword: input.mustChangePassword,
      tokenVersion: input.tokenVersion
    },
    getJwtSecret(),
    { expiresIn: "12h" }
  );
}

async function resolveAuthUser(req: Request) {
  if (req.authUser) {
    return req.authUser;
  }

  const cookies = parseCookies(req.headers.cookie);
  const token =
    parseBearerToken(req.headers.authorization) ?? cookies.get(AUTH_COOKIE_NAME);

  if (!token) {
    throw createError(401, "Authentication required.");
  }

  let payload: AuthTokenPayload;
  try {
    payload = jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
  } catch {
    throw createError(401, "Invalid or expired session.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub }
  });

  if (!user || user.status !== "ACTIVE") {
    throw createError(401, "Your account is inactive.");
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw createError(401, "Session is no longer valid. Please log in again.");
  }

  req.authUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    mustChangePassword: user.mustChangePassword
  };

  return req.authUser;
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    await resolveAuthUser(req);
    next();
  } catch (error) {
    next(error);
  }
}

export async function requirePasswordChangeResolved(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const authUser = await resolveAuthUser(req);

    if (authUser.mustChangePassword) {
      throw createError(403, "Password change required before accessing the system.");
    }

    next();
  } catch (error) {
    next(error);
  }
}

export async function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  try {
    const authUser = await resolveAuthUser(req);

    if (authUser.role !== "ADMIN") {
      throw createError(403, "Administrator access required.");
    }

    next();
  } catch (error) {
    next(error);
  }
}
