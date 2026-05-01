import fs from "node:fs";
import path from "node:path";
import { env } from "../config/env";
import { db } from "../db/database";
import { initializeSchema } from "../db/schema";

type CliOptions = {
  count: number;
  drop: boolean;
};

const FIRST_NAMES = [
  "Anton",
  "Maria",
  "Ivan",
  "Olga",
  "Dmitry",
  "Elena",
  "Alexey",
  "Sofia",
  "Nikita",
  "Anastasia",
  "Pavel",
  "Ekaterina",
  "Maxim",
  "Natalia",
  "Kirill",
  "Arina",
  "Mikhail",
  "Vera",
  "Roman",
  "Polina",
];

const LAST_NAMES = [
  "Ivanov",
  "Petrova",
  "Sidorov",
  "Kuznetsova",
  "Smirnov",
  "Volkova",
  "Fedorov",
  "Lebedeva",
  "Morozov",
  "Pavlova",
  "Novikov",
  "Orlova",
  "Kiselev",
  "Sokolova",
  "Belov",
  "Alekseeva",
  "Gromov",
  "Zaitseva",
  "Makarov",
  "Vinogradova",
];

const parseArgs = (): CliOptions => {
  const args = process.argv.slice(2);
  let count = 20;
  let drop = false;

  for (let index = 0; index < args.length; index += 1) {
    const value = args[index];
    if (value === "--drop") {
      drop = true;
      continue;
    }
    if (value === "--count" || value === "-c") {
      const nextValue = args[index + 1];
      const parsed = Number.parseInt(nextValue ?? "", 10);
      if (Number.isNaN(parsed) || parsed <= 0) {
        throw new Error("Invalid --count value. Use a positive integer.");
      }
      count = parsed;
      index += 1;
      continue;
    }
  }

  return { count, drop };
};

const randomFrom = <T>(items: T[]): T => {
  const idx = Math.floor(Math.random() * items.length);
  return items[idx];
};

const makeRandomGuestName = () => `${randomFrom(FIRST_NAMES)} ${randomFrom(LAST_NAMES)}`;

const getRandomNote = (index: number) => `generated-batch-${Date.now()}-${index + 1}`;

const resetDatabaseSchema = () => {
  db.exec("DROP TABLE IF EXISTS tickets;");
  initializeSchema(db);
};

const clearGeneratedTickets = () => {
  const directory = env.ticketsStorageDir;
  if (!fs.existsSync(directory)) {
    return;
  }

  const entries = fs.readdirSync(directory);
  for (const entry of entries) {
    if (!entry.endsWith(".png")) {
      continue;
    }
    fs.unlinkSync(path.join(directory, entry));
  }
};

const run = async () => {
  const options = parseArgs();

  if (options.drop) {
    resetDatabaseSchema();
    clearGeneratedTickets();
    console.log("Tickets table recreated and ticket files removed.");
  }

  const { createTicketService } = await import("../modules/tickets/tickets.service");

  for (let i = 0; i < options.count; i += 1) {
    const guestName = makeRandomGuestName();
    await createTicketService({
      guestName,
      note: getRandomNote(i),
    });
  }

  console.log(`Generated ${options.count} random tickets.`);
};

run().catch((error) => {
  console.error("Random generation failed:", error);
  process.exit(1);
});
