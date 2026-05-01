import type Database from "better-sqlite3";

export const initializeSchema = (db: Database.Database) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uuid TEXT NOT NULL UNIQUE,
      guestName TEXT NOT NULL,
      qrData TEXT NOT NULL UNIQUE,
      filePath TEXT NOT NULL,
      isUsed INTEGER NOT NULL DEFAULT 0,
      usedAt TEXT NULL,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      scannedBy TEXT NULL,
      note TEXT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_guest_name ON tickets(guestName);
    CREATE INDEX IF NOT EXISTS idx_tickets_is_used ON tickets(isUsed);
    CREATE INDEX IF NOT EXISTS idx_tickets_qr_data ON tickets(qrData);
  `);
};
