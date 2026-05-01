import { http, type ApiEnvelope } from "./http";
import type { Ticket, TicketStatusFilter } from "../types/ticket";

export const fetchTickets = async (params: { search: string; status: TicketStatusFilter }) => {
  const response = await http.get<ApiEnvelope<Ticket[]>>("/tickets", {
    params,
  });
  return response.data.data;
};

export const createTicket = async (payload: { guestName: string; note?: string | null }) => {
  const response = await http.post<ApiEnvelope<Ticket>>("/tickets", payload);
  return response.data.data;
};

export const updateTicket = async (
  id: number,
  payload: { guestName?: string; isUsed?: boolean; note?: string | null }
) => {
  const response = await http.patch<ApiEnvelope<Ticket>>(`/tickets/${id}`, payload);
  return response.data.data;
};

export const deleteTicket = async (id: number) => {
  await http.delete(`/tickets/${id}`);
};

export const regenerateTicket = async (id: number) => {
  const response = await http.post<ApiEnvelope<Ticket>>(`/tickets/${id}/regenerate`);
  return response.data.data;
};

export const downloadTicketFile = async (id: number, filename: string) => {
  const response = await http.get(`/tickets/${id}/file`, {
    responseType: "blob",
  });

  const blobUrl = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  link.click();
  window.URL.revokeObjectURL(blobUrl);
};
