import fs from "node:fs";
import { v4 as uuidv4 } from "uuid";
import type { Ticket } from "../../db/types";
import {
  createTicketRow,
  getAbsoluteFilePath,
  getTicketById,
  listTickets,
  toRelativeStoragePath,
  updateTicketRow,
  deleteTicketRow,
} from "./tickets.repository";
import { generateTicketPng, getTicketPngAbsolutePath } from "../../services/ticket-generator/ticket-generator.service";

export const listTicketsService = listTickets;

export const getTicketByIdService = (id: number) => {
  return getTicketById(id);
};

export const createTicketService = async (payload: { guestName: string; note: string | null }) => {
  const uuid = uuidv4();
  const qrData = uuid;
  const absolutePath = await generateTicketPng({
    uuid,
    guestName: payload.guestName,
    qrData,
  });

  const created = createTicketRow({
    uuid,
    guestName: payload.guestName,
    qrData,
    filePath: toRelativeStoragePath(absolutePath),
    note: payload.note,
  });

  if (!created) {
    throw new Error("Failed to create ticket");
  }

  return created;
};

export const regenerateTicketService = async (id: number) => {
  const existing = getTicketById(id);
  if (!existing) {
    return null;
  }

  const newFileAbsolutePath = await generateTicketPng({
    uuid: existing.uuid,
    guestName: existing.guestName,
    qrData: existing.qrData,
  });

  return updateTicketRow({
    id,
    filePath: toRelativeStoragePath(newFileAbsolutePath),
  });
};

export const updateTicketService = async (
  id: number,
  payload: { guestName?: string; isUsed?: boolean; note?: string | null }
) => {
  const existing = getTicketById(id);
  if (!existing) {
    return null;
  }

  let filePath = existing.filePath;
  if (payload.guestName !== undefined && payload.guestName !== existing.guestName) {
    const absolutePath = await generateTicketPng({
      uuid: existing.uuid,
      guestName: payload.guestName,
      qrData: existing.qrData,
    });
    filePath = toRelativeStoragePath(absolutePath);
  }

  let usedAt: string | null | undefined = undefined;
  let scannedBy: string | null | undefined = undefined;
  if (payload.isUsed !== undefined) {
    if (payload.isUsed) {
      usedAt = existing.usedAt ?? new Date().toISOString();
    } else {
      usedAt = null;
      scannedBy = null;
    }
  }

  return updateTicketRow({
    id,
    guestName: payload.guestName,
    isUsed: payload.isUsed,
    usedAt,
    scannedBy,
    note: payload.note,
    filePath,
  });
};

export const deleteTicketService = (id: number) => {
  return deleteTicketRow(id);
};

export const getTicketFileService = (id: number) => {
  const ticket = getTicketById(id);
  if (!ticket) {
    return null;
  }

  const absolutePath = getAbsoluteFilePath(ticket.filePath);
  if (!fs.existsSync(absolutePath)) {
    return { ticket, absolutePath, fileExists: false as const };
  }

  return { ticket, absolutePath, fileExists: true as const };
};

export const ensureTicketFileForSeed = async (ticket: Ticket) => {
  const absolutePath = getTicketPngAbsolutePath(ticket.uuid);
  if (!fs.existsSync(absolutePath)) {
    const generated = await generateTicketPng({
      uuid: ticket.uuid,
      guestName: ticket.guestName,
      qrData: ticket.qrData,
    });
    updateTicketRow({
      id: ticket.id,
      filePath: toRelativeStoragePath(generated),
    });
  }
};
