import { Router } from "express";
import { requirePinAuth } from "../../middlewares/auth-pin";
import { checkinController, checkinPreviewController } from "./checkin.controller";

export const checkinRouter = Router();

checkinRouter.post("/preview", requirePinAuth, checkinPreviewController);
checkinRouter.post("/", requirePinAuth, checkinController);
