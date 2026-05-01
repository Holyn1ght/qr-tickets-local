import { Router } from "express";
import { z } from "zod";
import { env } from "../../config/env";
import { sendError, sendSuccess } from "../../utils/api-response";

const authSchema = z.object({
  pin: z.string().trim().min(1),
});

export const authRouter = Router();

authRouter.post("/pin", (req, res) => {
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, "pin is required", 400);
  }

  const isValid = env.adminPins.includes(parsed.data.pin);
  if (!isValid) {
    return sendError(res, "Invalid PIN", 401);
  }

  return sendSuccess(res, { authorized: true });
});
