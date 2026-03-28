import type { NextFunction, Request, Response } from "express";

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  const status = error.status || 500;
  const message = error.message || "Internal server error";

  res.status(status).json({
    error: {
      message,
      status
    }
  });
}

