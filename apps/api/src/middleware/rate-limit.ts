import { rateLimit } from "express-rate-limit";

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skip: () => process.env.NODE_ENV !== "production",
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many login attempts. Please wait a few minutes and try again.",
      status: 429
    }
  }
});

export const accessRequestRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many access request attempts. Please wait before trying again.",
      status: 429
    }
  }
});
