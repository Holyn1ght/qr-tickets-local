import { z } from "zod";

export const checkinSchema = z.object({
  qrData: z.string().trim().min(1, "qrData is required"),
});
