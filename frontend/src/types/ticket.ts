export type Ticket = {
  id: number;
  uuid: string;
  guestName: string;
  qrData: string;
  filePath: string;
  isUsed: boolean;
  usedAt: string | null;
  createdAt: string;
  updatedAt: string;
  scannedBy: string | null;
  note: string | null;
};

export type TicketStatusFilter = "all" | "used" | "unused";

export type CheckinResponse = {
  id: number | null;
  guestName: string | null;
  uuid: string | null;
  status: "success" | "already_used" | "not_found";
  usedAt: string | null;
};

export type CheckinPreviewResponse = {
  id: number | null;
  guestName: string | null;
  uuid: string | null;
  status: "ready" | "already_used" | "not_found";
  usedAt: string | null;
};
