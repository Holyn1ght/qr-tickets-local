import cors from "cors";
import express from "express";
import { env } from "./config/env";
import { ticketsRouter } from "./modules/tickets/tickets.routes";
import { checkinRouter } from "./modules/checkin/checkin.routes";
import { authRouter } from "./modules/auth/auth.routes";
import { errorHandler } from "./middlewares/error-handler";
import { sendSuccess } from "./utils/api-response";
import { logger } from "./utils/logger";
import { requestLogger } from "./middlewares/request-logger";

export const app = express();

app.set("trust proxy", true);
app.use(requestLogger);

app.use(
  cors({
    origin(origin, callback) {
      logger.info("CORS check", {
        origin: origin ?? null,
        allowed: true,
        configuredClientOrigin: env.clientOrigin,
      });
      callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  sendSuccess(res, { status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketsRouter);
app.use("/api/checkin", checkinRouter);

app.use(errorHandler);
