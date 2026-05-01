import type { NextFunction, Request, Response } from "express";
import { env } from "../config/env";
import { sendError } from "../utils/api-response";

export type RequestWithPin = Request & { authPin?: string };

const extractPin = (req: Request) => {
  const headerPin = req.header("x-pin");
  if (headerPin) {
    return headerPin.trim();
  }

  const bodyPin = typeof req.body?.pin === "string" ? req.body.pin : null;
  if (bodyPin) {
    return bodyPin.trim();
  }

  return null;
};

export const requirePinAuth = (
  req: RequestWithPin,
  res: Response,
  next: NextFunction
) => {
  const pin = extractPin(req);

  if (!pin || !env.adminPins.includes(pin)) {
    return sendError(res, "Invalid PIN", 401);
  }

  req.authPin = pin;
  next();
};
