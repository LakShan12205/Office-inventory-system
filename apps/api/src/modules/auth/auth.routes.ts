import { Router } from "express";
import {
  accessRequestSchema,
  approveAccessRequestSchema,
  changePasswordSchema,
  loginSchema,
  rejectAccessRequestSchema
} from "./auth.schemas.js";
import {
  approveAccessRequest,
  changePassword,
  getCurrentUser,
  invalidateUserSession,
  listAccessRequests,
  login,
  rejectAccessRequest,
  submitAccessRequest
} from "./auth.service.js";
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
  requireAdmin,
  requireAuth,
  signAuthToken
} from "../../middleware/auth.js";
import { requireTrustedOrigin } from "../../middleware/csrf.js";
import { accessRequestRateLimiter, loginRateLimiter } from "../../middleware/rate-limit.js";

export const authRouter = Router();
export const accessRequestsRouter = Router();

authRouter.post("/login", loginRateLimiter, async (req, res, next) => {
  try {
    console.info("Login request received.", {
      username: typeof req.body?.username === "string" ? req.body.username : undefined
    });

    const payload = loginSchema.parse(req.body);
    const user = await login(payload);
    const token = signAuthToken({
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      tokenVersion: user.tokenVersion
    });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    res.status(200).json({ token, user });
  } catch (error) {
    console.error("Login route failed.", {
      username: typeof req.body?.username === "string" ? req.body.username : undefined,
      error
    });
    next(error);
  }
});

authRouter.post("/logout", requireAuth, requireTrustedOrigin, async (req, res, next) => {
  try {
    await invalidateUserSession(req.authUser!.id);

    res.clearCookie(AUTH_COOKIE_NAME, {
      ...getAuthCookieOptions(),
      maxAge: undefined
    });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await getCurrentUser(req.authUser!.id);
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

authRouter.post("/change-password", requireAuth, requireTrustedOrigin, async (req, res, next) => {
  try {
    const payload = changePasswordSchema.parse(req.body);
    const user = await changePassword(req.authUser!.id, payload);
    const token = signAuthToken({
      id: user.id,
      username: user.username,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      tokenVersion: user.tokenVersion
    });

    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
    res.json({ user });
  } catch (error) {
    next(error);
  }
});

accessRequestsRouter.post("/", accessRequestRateLimiter, async (req, res, next) => {
  try {
    const payload = accessRequestSchema.parse(req.body);
    const request = await submitAccessRequest(payload);
    res.status(201).json({
      request,
      message:
        "Your request has been submitted. An administrator will send your login credentials after approval."
    });
  } catch (error) {
    next(error);
  }
});

accessRequestsRouter.get("/", requireAdmin, async (_req, res, next) => {
  try {
    const requests = await listAccessRequests();
    res.json({ requests });
  } catch (error) {
    next(error);
  }
});

accessRequestsRouter.post("/:id/approve", requireAdmin, requireTrustedOrigin, async (req, res, next) => {
  try {
    const payload = approveAccessRequestSchema.parse(req.body);
    const result = await approveAccessRequest({
      requestId: String(req.params.id),
      reviewerId: req.authUser!.id,
      role: payload.role
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

accessRequestsRouter.post("/:id/reject", requireAdmin, requireTrustedOrigin, async (req, res, next) => {
  try {
    const payload = rejectAccessRequestSchema.parse(req.body);
    const result = await rejectAccessRequest({
      requestId: String(req.params.id),
      reviewerId: req.authUser!.id,
      reason: payload.reason
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});
