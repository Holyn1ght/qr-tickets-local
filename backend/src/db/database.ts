import path from "node:path";
import fs from "node:fs";
import Database from "better-sqlite3";
import { env } from "../config/env";
import { initializeSchema } from "./schema";

const dbDir = path.dirname(env.databaseFile);
fs.mkdirSync(dbDir, { recursive: true });

export const db = new Database(env.databaseFile);
db.pragma("journal_mode = WAL");

initializeSchema(db);
