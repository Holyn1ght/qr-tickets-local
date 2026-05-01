import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { sendError } from "../utils/api-response";

export const errorHandler = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (error instanceof ZodError) {
    const message = error.issues.map((issue) => issue.message).join("; ");
    return sendError(res, message || "Validation failed", 400);
  }

  if (error instanceof Error) {
    return sendError(res, error.message || "Internal server error", 500);
  }

  return sendError(res, "Internal server error", 500);
};
