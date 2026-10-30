<script setup lang="ts">
import { computed, ref, watch } from "vue";
import axios from "axios";
import { createTicket, fetchTickets } from "../api/tickets";
import { guestNameKey, parseGuestRows, validateImportGuest, type ImportGuest } from "../utils/guest-import";

defineProps<{ open: boolean }>();
const emit = defineEmits<{ close: []; imported: [] }>();
const sheets = ref<{ sheet: string; data: unknown[][] }[]>([]);
const selectedSheet = ref(0);
const filename = ref("");
const guests = ref<ImportGuest[]>([]);
const skipDuplicates = ref(true);
const busy = ref(false);
const reading = ref(false);
const error = ref("");
const summary = ref("");
const processed = ref(0);
const completed = ref(new Set<number>());
const skipped = ref(new Set<number>());
const canImport = computed(() => guests.value.length > 0 &&
  guests.value.every((guest) => !guest.error) &&
  guests.value.some((guest) => !completed.value.has(guest.line)) && !busy.value && !reading.value);

const parseSelectedSheet = () => {
  completed.value = new Set();
  skipped.value = new Set();
  summary.value = "";
  error.value = "";
  guests.value = [];
  const sheet = sheets.value[selectedSheet.value];
  if (!sheet) return;
  try {
    guests.value = parseGuestRows(sheet.data);
    if (!guests.value.length) error.value = "На листе нет гостей для импорта.";
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Не удалось прочитать лист.";
  }
};
watch(selectedSheet, parseSelectedSheet);

const onGuestEdited = (guest: ImportGuest) => {
  guest.error = validateImportGuest(guest.guestName, guest.note);
  skipped.value.delete(guest.line);
  summary.value = "";
};

const readFile = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  sheets.value = [];
  guests.value = [];
  filename.value = "";
  completed.value = new Set();
  skipped.value = new Set();
  summary.value = "";
  error.value = "";
  if (!file.name.toLowerCase().endsWith(".xlsx") || file.size > 5 * 1024 * 1024) {
    error.value = "Выберите файл Excel .xlsx размером до 5 МБ.";
    input.value = "";
    return;
  }
  reading.value = true;
  try {
    const { default: readExcelFile } = await import("read-excel-file/browser");
    sheets.value = await readExcelFile(file);
    filename.value = file.name;
    selectedSheet.value = 0;
    parseSelectedSheet();
  } catch {
    error.value = "Не удалось прочитать Excel. Проверьте, что файл сохранён в формате .xlsx и не защищён паролем.";
  } finally {
    reading.value = false;
    input.value = "";
  }
};

const runImport = async () => {
  if (!canImport.value) return;
  busy.value = true;
  error.value = "";
  summary.value = "";
  processed.value = 0;
  skipped.value = new Set();
  let created = 0;
  let currentLine: number | null = null;
  try {
    // Always compare with the complete list, regardless of the page's filters.
    const existing = await fetchTickets({ search: "", status: "all" });
    const names = new Set(existing.map((ticket) => guestNameKey(ticket.guestName)));
    for (const guest of guests.value) {
      currentLine = guest.line;
      const key = guestNameKey(guest.guestName);
      if (completed.value.has(guest.line)) {
        processed.value++;
        continue;
      }
      if (skipDuplicates.value && names.has(key)) {
        skipped.value.add(guest.line);
      } else {
        await createTicket({ guestName: guest.guestName.trim(), note: guest.note?.trim() || null });
        completed.value.add(guest.line);
        names.add(key);
        created++;
      }
      processed.value++;
    }
  } catch (cause) {
    const message = axios.isAxiosError(cause)
      ? cause.response?.data?.error?.message ?? "Нет ответа от сервера"
      : "Не удалось создать билет";
    error.value = `Импорт остановлен${currentLine === null ? "" : ` на строке ${currentLine}`}: ${message}. Уже созданные билеты сохранены. Можно повторить импорт; при включённом пропуске совпадений они не добавятся повторно.`;
  } finally {
    summary.value = `Создано: ${created}. Пропущено совпадений: ${skipped.value.size}.`;
    busy.value = false;
    emit("imported");
  }
};
</script>

<template>
  <div v-if="open" class="modal-overlay" @click.self="!busy && !reading && emit('close')">
    <section class="modal-card import-modal" role="dialog" aria-modal="true" aria-labelledby="import-title">
      <h3 id="import-title">Импорт гостей</h3>
      <p class="small">Загрузите Excel со столбцами «Имя» и «Доп. информация». Дополнительная информация сохранится как внутреннее примечание для организаторов и не появится на билете. Один человек на строку.</p>
      <div class="field">
        <label for="guest-file">Файл Excel (.xlsx, до 5 МБ)</label>
        <input id="guest-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" :disabled="busy || reading" @change="readFile" />
        <span v-if="reading" class="small">Читаем Excel…</span>
        <span v-else-if="filename" class="small">{{ filename }}</span>
      </div>
      <div v-if="sheets.length > 1" class="field">
        <label for="guest-sheet">Лист Excel</label>
        <select id="guest-sheet" v-model="selectedSheet" :disabled="busy || reading">
          <option v-for="(sheet, index) in sheets" :key="index" :value="index">{{ sheet.sheet }}</option>
        </select>
      </div>
      <label class="import-option">
        <input v-model="skipDuplicates" type="checkbox" :disabled="busy" />
        Пропускать совпадающие имена в списке и среди существующих гостей
      </label>
      <p class="small">Совпадения определяются по имени без учёта регистра и лишних пробелов. Для однофамильцев с одинаковым именем отключите пропуск.</p>
      <template v-if="guests.length">
        <p>Найдено гостей: {{ guests.length }}. Имена и примечания можно исправить прямо в таблице.</p>
        <div class="table-wrap import-preview">
          <table>
            <thead><tr><th>Строка</th><th>Имя</th><th>Для организаторов</th><th>Результат</th></tr></thead>
            <tbody>
              <tr v-for="guest in guests" :key="guest.line">
                <td>{{ guest.line }}</td>
                <td><input v-model="guest.guestName" type="text" :aria-label="`Имя, строка ${guest.line}`" :disabled="busy || completed.has(guest.line)" @input="onGuestEdited(guest)" /></td>
                <td><input v-model="guest.note" type="text" :aria-label="`Примечание, строка ${guest.line}`" :disabled="busy || completed.has(guest.line)" @input="onGuestEdited(guest)" /></td>
                <td :class="{ 'error-text': guest.error }">{{ guest.error || (completed.has(guest.line) ? 'Создан' : skipped.has(guest.line) ? 'Совпадение' : '—') }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <div aria-live="polite">
        <p v-if="busy" class="loading-inline"><span class="spinner" />Обработано {{ processed }} из {{ guests.length }}. Создаются QR-билеты, оставьте окно открытым.</p>
        <progress v-if="busy" :value="processed" :max="guests.length" class="import-progress" />
        <p v-if="summary">{{ summary }}</p>
        <p v-if="error" class="error-text" role="alert">{{ error }}</p>
      </div>
      <div class="modal-actions">
        <button class="btn ghost" :disabled="busy || reading" @click="emit('close')">Закрыть</button>
        <button class="btn" :disabled="!canImport" @click="runImport">{{ busy ? 'Импорт…' : 'Импортировать' }}</button>
      </div>
    </section>
  </div>
</template>
