import type { Response } from "express";
import { sendSuccess } from "../../utils/api-response";
import { checkinSchema } from "./checkin.schemas";
import { checkinByQrData, previewCheckinByQrData } from "./checkin.service";
import type { RequestWithPin } from "../../middlewares/auth-pin";

export const checkinController = (req: RequestWithPin, res: Response) => {
  const payload = checkinSchema.parse(req.body);
  const pin = req.authPin ?? "unknown";

  const result = checkinByQrData(payload.qrData, pin);
  return sendSuccess(res, result);
};

export const checkinPreviewController = (req: RequestWithPin, res: Response) => {
  const payload = checkinSchema.parse(req.body);
  const result = previewCheckinByQrData(payload.qrData);
  return sendSuccess(res, result);
};
