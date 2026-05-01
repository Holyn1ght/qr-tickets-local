import { z } from "zod";

export const listTicketsQuerySchema = z.object({
  search: z.string().trim().optional(),
  status: z.enum(["all", "used", "unused"]).default("all"),
});

export const createTicketSchema = z.object({
  guestName: z.string().trim().min(1, "guestName is required").max(120),
  note: z.string().trim().max(500).nullable().optional(),
});

export const updateTicketSchema = z
  .object({
    guestName: z.string().trim().min(1).max(120).optional(),
    isUsed: z.boolean().optional(),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .refine(
    (data) =>
      data.guestName !== undefined || data.isUsed !== undefined || data.note !== undefined,
    {
      message: "Provide at least one field to update",
    }
  );
