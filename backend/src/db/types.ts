export type TicketRow = {
  id: number;
  uuid: string;
  guestName: string;
  qrData: string;
  filePath: string;
  isUsed: number;
  usedAt: string | null;
  createdAt: string;
  updatedAt: string;
  scannedBy: string | null;
  note: string | null;
};

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
