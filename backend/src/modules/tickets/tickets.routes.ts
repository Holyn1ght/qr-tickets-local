import { Router } from "express";
import {
  createTicketController,
  deleteTicketController,
  downloadTicketController,
  getTicketByIdController,
  listTicketsController,
  regenerateTicketController,
  updateTicketController,
} from "./tickets.controller";
import { requirePinAuth } from "../../middlewares/auth-pin";

export const ticketsRouter = Router();

ticketsRouter.get("/", requirePinAuth, listTicketsController);
ticketsRouter.get("/:id", requirePinAuth, getTicketByIdController);
ticketsRouter.post("/", requirePinAuth, createTicketController);
ticketsRouter.patch("/:id", requirePinAuth, updateTicketController);
ticketsRouter.delete("/:id", requirePinAuth, deleteTicketController);
ticketsRouter.post("/:id/regenerate", requirePinAuth, regenerateTicketController);
ticketsRouter.get("/:id/file", requirePinAuth, downloadTicketController);
