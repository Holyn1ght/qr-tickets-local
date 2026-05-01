<script setup lang="ts">
import { ref, watch } from "vue";
import axios from "axios";
import PinGate from "../components/PinGate.vue";
import TicketFormModal from "../components/TicketFormModal.vue";
import {
  createTicket,
  deleteTicket,
  downloadTicketFile,
  fetchTickets,
  regenerateTicket,
  updateTicket,
} from "../api/tickets";
import type { Ticket, TicketStatusFilter } from "../types/ticket";
import { usePinAuth } from "../composables/usePinAuth";

const { isAuthorized } = usePinAuth();

const tickets = ref<Ticket[]>([]);
const search = ref("");
const status = ref<TicketStatusFilter>("all");
const loading = ref(false);
const pageError = ref("");

const createGuestName = ref("");
const creating = ref(false);
const editModalOpen = ref(false);
const editingTicket = ref<Ticket | null>(null);
const modalLoading = ref(false);

const setApiError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    pageError.value = error.response?.data?.error?.message ?? fallback;
  } else {
    pageError.value = fallback;
  }
};

const loadTickets = async () => {
  loading.value = true;
  pageError.value = "";
  try {
    tickets.value = await fetchTickets({
      search: search.value.trim(),
      status: status.value,
    });
  } catch (error) {
    if (axios.isAxiosError(error)) {
      pageError.value = error.response?.data?.error?.message ?? "Failed to load tickets";
    } else {
      pageError.value = "Failed to load tickets";
    }
  } finally {
    loading.value = false;
  }
};

const onCreateInline = async () => {
  const guestName = createGuestName.value.trim();

  if (!guestName || !isAuthorized.value || creating.value) {
    return;
  }

  creating.value = true;
  try {
    await createTicket({ guestName });
    createGuestName.value = "";
    await loadTickets();
  } catch (error) {
    setApiError(error, "Failed to create ticket");
  } finally {
    creating.value = false;
  }
};

const onEdit = async (payload: { guestName: string; note: string | null }) => {
  if (!editingTicket.value) {
    return;
  }
  modalLoading.value = true;
  try {
    await updateTicket(editingTicket.value.id, payload);
    editModalOpen.value = false;
    editingTicket.value = null;
    await loadTickets();
  } catch (error) {
    setApiError(error, "Failed to update ticket");
  } finally {
    modalLoading.value = false;
  }
};

const setUsed = async (ticket: Ticket, used: boolean) => {
  try {
    await updateTicket(ticket.id, { isUsed: used });
    await loadTickets();
  } catch (error) {
    setApiError(error, "Failed to change ticket status");
  }
};

const onDelete = async (ticket: Ticket) => {
  if (!window.confirm(`Delete ticket for "${ticket.guestName}"?`)) {
    return;
  }
  try {
    await deleteTicket(ticket.id);
    await loadTickets();
  } catch (error) {
    setApiError(error, "Failed to delete ticket");
  }
};

const onRegenerate = async (ticket: Ticket) => {
  try {
    await regenerateTicket(ticket.id);
    await loadTickets();
  } catch (error) {
    setApiError(error, "Failed to regenerate ticket");
  }
};

const onDownload = async (ticket: Ticket) => {
  try {
    await downloadTicketFile(ticket.id, `${ticket.uuid}.png`);
  } catch (error) {
    setApiError(error, "Failed to download ticket");
  }
};

watch(
  isAuthorized,
  (authorized) => {
    if (authorized) {
      loadTickets();
    } else {
      tickets.value = [];
    }
  },
  { immediate: true }
);
</script>

<template>
  <div>
    <section class="stack">
      <PinGate />
      <div class="card">
        <div class="toolbar">
          <h2>Tickets Admin</h2>
        </div>

        <div class="create-inline">
          <input
            v-model="createGuestName"
            type="text"
            maxlength="120"
            placeholder="New guest name"
            :disabled="!isAuthorized || creating"
            @keyup.enter="onCreateInline"
          />
          <button
            class="btn"
            :disabled="!isAuthorized || creating || !createGuestName.trim()"
            @click="onCreateInline"
          >
            <span class="btn-content">
              <span v-if="creating" class="spinner spinner-sm" />
              Create
            </span>
          </button>
        </div>

        <div class="filters">
          <input
            v-model="search"
            type="text"
            placeholder="Search by guest name"
            @keyup.enter="loadTickets"
          />
          <select v-model="status" @change="loadTickets">
            <option value="all">All</option>
            <option value="used">Used</option>
            <option value="unused">Unused</option>
          </select>
          <button class="btn ghost" @click="loadTickets">Apply</button>
        </div>

        <p v-if="pageError" class="error-text">{{ pageError }}</p>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Guest</th>
                <th>UUID</th>
                <th>Status</th>
                <th>Created</th>
                <th>Used At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading">
                <td colspan="7">
                  <span class="loading-inline">
                    <span class="spinner" />
                    Loading tickets...
                  </span>
                </td>
              </tr>
              <tr v-else-if="tickets.length === 0">
                <td colspan="7">No tickets found</td>
              </tr>
              <tr v-for="ticket in tickets" :key="ticket.id">
                <td>{{ ticket.id }}</td>
                <td>{{ ticket.guestName }}</td>
                <td class="small">{{ ticket.uuid }}</td>
                <td>
                  <span :class="ticket.isUsed ? 'status used' : 'status unused'">
                    {{ ticket.isUsed ? "Used" : "Unused" }}
                  </span>
                </td>
                <td>{{ new Date(ticket.createdAt).toLocaleString() }}</td>
                <td>{{ ticket.usedAt ? new Date(ticket.usedAt).toLocaleString() : "-" }}</td>
                <td>
                  <div class="actions">
                    <button
                      class="btn ghost"
                      :disabled="!isAuthorized"
                      @click="
                        editingTicket = ticket;
                        editModalOpen = true;
                      "
                    >
                      Edit
                    </button>
                    <button
                      class="btn ghost"
                      :disabled="!isAuthorized"
                      @click="onRegenerate(ticket)"
                    >
                      Regenerate
                    </button>
                    <button class="btn ghost" :disabled="!isAuthorized" @click="onDownload(ticket)">
                      Download
                    </button>
                    <button
                      class="btn ghost"
                      :disabled="!isAuthorized || ticket.isUsed"
                      @click="setUsed(ticket, true)"
                    >
                      Mark used
                    </button>
                    <button
                      class="btn ghost"
                      :disabled="!isAuthorized || !ticket.isUsed"
                      @click="setUsed(ticket, false)"
                    >
                      Reset used
                    </button>
                    <button class="btn danger" :disabled="!isAuthorized" @click="onDelete(ticket)">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <TicketFormModal
      :open="editModalOpen"
      title="Edit ticket"
      :initial-guest-name="editingTicket?.guestName"
      :initial-note="editingTicket?.note"
      :loading="modalLoading"
      @close="
        editModalOpen = false;
        editingTicket = null;
      "
      @save="onEdit"
    />
  </div>
</template>
