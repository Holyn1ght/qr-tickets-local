import { listTicketsService, createTicketService } from "../modules/tickets/tickets.service";

const seed = async () => {
  const existing = listTicketsService({ status: "all" });
  if (existing.length > 0) {
    console.log("Seed skipped: tickets already exist");
    return;
  }

  const guests = ["Anton", "Maria", "Ivan"];
  for (const guestName of guests) {
    await createTicketService({ guestName, note: null });
  }

  console.log(`Seed complete: created ${guests.length} tickets`);
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
