import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

const resolveFromRoot = (value: string) => path.resolve(process.cwd(), value);

const splitPins = (value: string) =>
  value
    .split(",")
    .map((pin) => pin.trim())
    .filter(Boolean);

export const env = {
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "https://localhost:5173",
  databaseFile: resolveFromRoot(process.env.DATABASE_FILE ?? "./storage/app.db"),
  ticketsStorageDir: resolveFromRoot(process.env.TICKETS_STORAGE_DIR ?? "./storage/tickets"),
  ticketBackgroundPath: resolveFromRoot(
    process.env.TICKET_BACKGROUND_PATH ?? "./assets/ticket-background.png"
  ),
  adminPins: splitPins(process.env.ADMIN_PINS ?? "1234"),
  eventName: process.env.EVENT_NAME ?? "Local Event",
};
