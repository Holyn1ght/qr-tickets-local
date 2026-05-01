import type { Request, Response } from "express";
import { sendError, sendSuccess } from "../../utils/api-response";
import { createTicketSchema, listTicketsQuerySchema, updateTicketSchema } from "./tickets.schemas";
import {
  createTicketService,
  deleteTicketService,
  getTicketByIdService,
  getTicketFileService,
  listTicketsService,
  regenerateTicketService,
  updateTicketService,
} from "./tickets.service";

const parseTicketId = (id: string | string[]) => {
  const raw = Array.isArray(id) ? id[0] : id;
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("Invalid ticket id");
  }
  return parsed;
};

export const listTicketsController = (req: Request, res: Response) => {
  const query = listTicketsQuerySchema.parse(req.query);
  const tickets = listTicketsService(query);
  return sendSuccess(res, tickets);
};

export const getTicketByIdController = (req: Request, res: Response) => {
  const id = parseTicketId(req.params.id);
  const ticket = getTicketByIdService(id);
  if (!ticket) {
    return sendError(res, "Ticket not found", 404);
  }

  return sendSuccess(res, ticket);
};

export const createTicketController = async (req: Request, res: Response) => {
  const body = createTicketSchema.parse(req.body);
  const ticket = await createTicketService({
    guestName: body.guestName,
    note: body.note ?? null,
  });
  return sendSuccess(res, ticket, 201);
};

export const updateTicketController = async (req: Request, res: Response) => {
  const id = parseTicketId(req.params.id);
  const body = updateTicketSchema.parse(req.body);
  const updated = await updateTicketService(id, body);
  if (!updated) {
    return sendError(res, "Ticket not found", 404);
  }

  return sendSuccess(res, updated);
};

export const deleteTicketController = (req: Request, res: Response) => {
  const id = parseTicketId(req.params.id);
  const deleted = deleteTicketService(id);
  if (!deleted) {
    return sendError(res, "Ticket not found", 404);
  }

  return sendSuccess(res, { id: deleted.id });
};

export const regenerateTicketController = async (req: Request, res: Response) => {
  const id = parseTicketId(req.params.id);
  const ticket = await regenerateTicketService(id);

  if (!ticket) {
    return sendError(res, "Ticket not found", 404);
  }

  return sendSuccess(res, ticket);
};

export const downloadTicketController = (req: Request, res: Response) => {
  const id = parseTicketId(req.params.id);
  const result = getTicketFileService(id);

  if (!result) {
    return sendError(res, "Ticket not found", 404);
  }

  if (!result.fileExists) {
    return sendError(res, "Ticket file not found on disk", 404);
  }

  return res.download(result.absolutePath, `${result.ticket.uuid}.png`);
};
