import fs from "node:fs";
import path from "node:path";
import { db } from "../../db/database";
import type { Ticket, TicketRow } from "../../db/types";

const mapTicket = (row: TicketRow): Ticket => ({
  ...row,
  isUsed: Boolean(row.isUsed),
});

export const toRelativeStoragePath = (absolutePath: string) =>
  path.relative(process.cwd(), absolutePath).replaceAll("\\", "/");

export const getAbsoluteFilePath = (filePath: string) =>
  path.resolve(process.cwd(), filePath);

export const listTickets = (params: { search?: string; status: "all" | "used" | "unused" }) => {
  const conditions: string[] = [];
  const queryParams: unknown[] = [];

  if (params.search) {
    conditions.push("guestName LIKE ?");
    queryParams.push(`%${params.search}%`);
  }

  if (params.status === "used") {
    conditions.push("isUsed = 1");
  }
  if (params.status === "unused") {
    conditions.push("isUsed = 0");
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const sql = `
    SELECT id, uuid, guestName, qrData, filePath, isUsed, usedAt, createdAt, updatedAt, scannedBy, note
    FROM tickets
    ${whereClause}
    ORDER BY id DESC
  `;

  const rows = db.prepare(sql).all(...queryParams) as TicketRow[];
  return rows.map(mapTicket);
};

export const getTicketById = (id: number): Ticket | null => {
  const row = db
    .prepare(
      `
      SELECT id, uuid, guestName, qrData, filePath, isUsed, usedAt, createdAt, updatedAt, scannedBy, note
      FROM tickets
      WHERE id = ?
    `
    )
    .get(id) as TicketRow | undefined;

  return row ? mapTicket(row) : null;
};

export const getTicketByQrData = (qrData: string): Ticket | null => {
  const row = db
    .prepare(
      `
      SELECT id, uuid, guestName, qrData, filePath, isUsed, usedAt, createdAt, updatedAt, scannedBy, note
      FROM tickets
      WHERE qrData = ?
    `
    )
    .get(qrData) as TicketRow | undefined;

  return row ? mapTicket(row) : null;
};

export const createTicketRow = (params: {
  uuid: string;
  guestName: string;
  qrData: string;
  filePath: string;
  note: string | null;
}) => {
  const now = new Date().toISOString();
  const result = db
    .prepare(
      `
      INSERT INTO tickets (uuid, guestName, qrData, filePath, isUsed, usedAt, createdAt, updatedAt, scannedBy, note)
      VALUES (?, ?, ?, ?, 0, NULL, ?, ?, NULL, ?)
    `
    )
    .run(params.uuid, params.guestName, params.qrData, params.filePath, now, now, params.note);

  return getTicketById(Number(result.lastInsertRowid));
};

export const updateTicketRow = (params: {
  id: number;
  guestName?: string;
  filePath?: string;
  isUsed?: boolean;
  usedAt?: string | null;
  scannedBy?: string | null;
  note?: string | null;
}) => {
  const current = getTicketById(params.id);
  if (!current) {
    return null;
  }

  const nextGuestName = params.guestName ?? current.guestName;
  const nextFilePath = params.filePath ?? current.filePath;
  const nextIsUsed = params.isUsed ?? current.isUsed;
  const nextUsedAt = params.usedAt !== undefined ? params.usedAt : current.usedAt;
  const nextScannedBy = params.scannedBy !== undefined ? params.scannedBy : current.scannedBy;
  const nextNote = params.note !== undefined ? params.note : current.note;
  const now = new Date().toISOString();

  db.prepare(
    `
    UPDATE tickets
    SET guestName = ?, filePath = ?, isUsed = ?, usedAt = ?, scannedBy = ?, note = ?, updatedAt = ?
    WHERE id = ?
  `
  ).run(
    nextGuestName,
    nextFilePath,
    nextIsUsed ? 1 : 0,
    nextUsedAt,
    nextScannedBy,
    nextNote,
    now,
    params.id
  );

  return getTicketById(params.id);
};

export const deleteTicketRow = (id: number) => {
  const ticket = getTicketById(id);
  if (!ticket) {
    return null;
  }

  db.prepare("DELETE FROM tickets WHERE id = ?").run(id);

  const absolute = getAbsoluteFilePath(ticket.filePath);
  if (fs.existsSync(absolute)) {
    fs.unlinkSync(absolute);
  }

  return ticket;
};
