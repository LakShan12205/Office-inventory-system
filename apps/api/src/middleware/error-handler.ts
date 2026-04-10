import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

export function errorHandler(error: any, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof ZodError) {
    res.status(400).json({
      error: {
        message: "Please correct the highlighted form details.",
        status: 400,
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      }
    });
    return;
  }

  const status = error.status || 500;
  const message = error.message || "Internal server error";

  res.status(status).json({
    error: {
      message,
      status
    }
  });
}
