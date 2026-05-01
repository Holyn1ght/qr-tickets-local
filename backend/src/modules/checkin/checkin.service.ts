import { db } from "../../db/database";
import type { TicketRow } from "../../db/types";

type CheckinStatus = "success" | "already_used" | "not_found";
type CheckinPreviewStatus = "ready" | "already_used" | "not_found";

export type CheckinResult = {
  id: number | null;
  guestName: string | null;
  uuid: string | null;
  status: CheckinStatus;
  usedAt: string | null;
};

export type CheckinPreviewResult = {
  id: number | null;
  guestName: string | null;
  uuid: string | null;
  status: CheckinPreviewStatus;
  usedAt: string | null;
};

const mapTicket = (row: TicketRow) => ({
  id: row.id,
  guestName: row.guestName,
  uuid: row.uuid,
  isUsed: Boolean(row.isUsed),
  usedAt: row.usedAt,
});

const findTicketStmt = db.prepare(`
  SELECT id, uuid, guestName, qrData, filePath, isUsed, usedAt, createdAt, updatedAt, scannedBy, note
  FROM tickets
  WHERE qrData = ?
`);

const markUsedStmt = db.prepare(`
  UPDATE tickets
  SET isUsed = 1, usedAt = ?, scannedBy = ?, updatedAt = ?
  WHERE id = ?
`);

const checkinTx = db.transaction((qrData: string, scannedBy: string): CheckinResult => {
  const row = findTicketStmt.get(qrData) as TicketRow | undefined;

  if (!row) {
    return {
      id: null,
      guestName: null,
      uuid: null,
      status: "not_found",
      usedAt: null,
    };
  }

  const ticket = mapTicket(row);
  if (ticket.isUsed) {
    return {
      id: ticket.id,
      guestName: ticket.guestName,
      uuid: ticket.uuid,
      status: "already_used",
      usedAt: ticket.usedAt,
    };
  }

  const usedAt = new Date().toISOString();
  const now = usedAt;
  markUsedStmt.run(usedAt, scannedBy, now, ticket.id);

  return {
    id: ticket.id,
    guestName: ticket.guestName,
    uuid: ticket.uuid,
    status: "success",
    usedAt,
  };
});

export const checkinByQrData = (qrData: string, scannedBy: string) => checkinTx(qrData, scannedBy);

export const previewCheckinByQrData = (qrData: string): CheckinPreviewResult => {
  const row = findTicketStmt.get(qrData) as TicketRow | undefined;

  if (!row) {
    return {
      id: null,
      guestName: null,
      uuid: null,
      status: "not_found",
      usedAt: null,
    };
  }

  const ticket = mapTicket(row);
  if (ticket.isUsed) {
    return {
      id: ticket.id,
      guestName: ticket.guestName,
      uuid: ticket.uuid,
      status: "already_used",
      usedAt: ticket.usedAt,
    };
  }

  return {
    id: ticket.id,
    guestName: ticket.guestName,
    uuid: ticket.uuid,
    status: "ready",
    usedAt: null,
  };
};
