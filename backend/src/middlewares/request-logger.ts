import type { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startedAt = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    logger.info("HTTP request", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      origin: req.headers.origin ?? null,
      ip: req.ip,
      forwardedFor: req.headers["x-forwarded-for"] ?? null,
      userAgent: req.headers["user-agent"] ?? null,
    });
  });

  next();
};
