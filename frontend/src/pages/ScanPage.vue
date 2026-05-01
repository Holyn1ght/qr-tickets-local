<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { Html5Qrcode } from "html5-qrcode";
import PinGate from "../components/PinGate.vue";
import { checkin, previewCheckin } from "../api/checkin";
import type { CheckinPreviewResponse, CheckinResponse } from "../types/ticket";
import { usePinAuth } from "../composables/usePinAuth";

const scannerElementId = "qr-scanner";
const { isAuthorized } = usePinAuth();
const scanner = ref<Html5Qrcode | null>(null);
const scanning = ref(false);
const lastResult = ref<CheckinResponse | null>(null);
const scanError = ref("");
const processingScan = ref(false);
const lastScannedValue = ref("");
const scannerCardRef = ref<HTMLElement | null>(null);
const pendingQrData = ref<string | null>(null);
const pendingPreview = ref<CheckinPreviewResponse | null>(null);
const confirmLoading = ref(false);
const hasPendingConfirmation = computed(() => pendingPreview.value?.status === "ready");

const stateClass = computed(() => {
  if (hasPendingConfirmation.value) return "state-box confirm";
  if (!lastResult.value) return "state-box";
  if (lastResult.value.status === "success") return "state-box success";
  if (lastResult.value.status === "already_used") return "state-box warning";
  return "state-box danger";
});

const resultTitle = computed(() => {
  if (hasPendingConfirmation.value) return "ОЖИДАЕТСЯ ПОДТВЕРЖДЕНИЕ";
  if (!lastResult.value) return "Ожидание сканирования";
  if (lastResult.value.status === "success") return "ПРОХОД РАЗРЕШЕН";
  if (lastResult.value.status === "already_used") return "БИЛЕТ УЖЕ ИСПОЛЬЗОВАН";
  return "БИЛЕТ НЕ НАЙДЕН";
});

const resultDescription = computed(() => {
  if (hasPendingConfirmation.value) {
    const preview = pendingPreview.value;
    return `Найден билет: ${preview?.guestName ?? "-"}. Подтвердить отметку прохода?`;
  }
  if (!lastResult.value) return "Наведите камеру на QR-код билета.";
  if (lastResult.value.status === "success") {
    return `Гость: ${lastResult.value.guestName ?? "-"}`;
  }
  if (lastResult.value.status === "already_used") {
    const usedAt = lastResult.value.usedAt
      ? new Date(lastResult.value.usedAt).toLocaleString()
      : "-";
    return `Ранее отмечен как использованный: ${usedAt}`;
  }
  return "Проверьте QR-код или создайте билет в админке.";
});

const resultTicketId = computed(() => {
  if (hasPendingConfirmation.value) {
    return pendingPreview.value?.uuid ?? "-";
  }
  return lastResult.value?.uuid ?? null;
});

watch(
  isAuthorized,
  async (authorized, prev) => {
    if (authorized) {
      await nextTick();
      if (!prev) {
        scannerCardRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      await startScan();
    }
  },
  { immediate: true }
);

async function startScan() {
  if (scanning.value || !isAuthorized.value) {
    return;
  }

  scanError.value = "";
  lastResult.value = null;
  pendingQrData.value = null;
  pendingPreview.value = null;
  const instance = new Html5Qrcode(scannerElementId);
  scanner.value = instance;

  try {
    await instance.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      async (decodedText) => {
        if (processingScan.value) {
          return;
        }
        if (pendingPreview.value) {
          return;
        }
        if (decodedText === lastScannedValue.value) {
          return;
        }

        processingScan.value = true;
        lastScannedValue.value = decodedText;
        try {
          const preview = await previewCheckin(decodedText);

          if (preview.status === "ready") {
            pendingQrData.value = decodedText;
            pendingPreview.value = preview;
            lastResult.value = null;
          } else {
            lastResult.value = {
              id: preview.id,
              guestName: preview.guestName,
              uuid: preview.uuid,
              status: preview.status,
              usedAt: preview.usedAt,
            };
          }
        } catch {
          scanError.value = "Check-in preview request failed";
        } finally {
          setTimeout(() => {
            processingScan.value = false;
            lastScannedValue.value = "";
          }, 1200);
        }
      },
      () => {
        // Ignore decode errors to keep scanner running.
      }
    );
    scanning.value = true;
  } catch {
    scanError.value = "Cannot start camera scanner";
    scanner.value = null;
    scanning.value = false;
  }
}

const confirmCheckin = async () => {
  if (!pendingQrData.value || confirmLoading.value) {
    return;
  }

  confirmLoading.value = true;
  scanError.value = "";
  try {
    lastResult.value = await checkin(pendingQrData.value);
    pendingQrData.value = null;
    pendingPreview.value = null;
  } catch {
    scanError.value = "Failed to confirm check-in";
  } finally {
    confirmLoading.value = false;
  }
};

const cancelCheckin = () => {
  pendingQrData.value = null;
  pendingPreview.value = null;
};

const stopScan = async () => {
  if (!scanner.value || !scanning.value) {
    return;
  }
  await scanner.value.stop();
  await scanner.value.clear();
  scanning.value = false;
  scanner.value = null;
};

onBeforeUnmount(async () => {
  if (scanning.value) {
    await stopScan();
  }
});
</script>

<template>
  <section class="stack">
    <PinGate v-if="!isAuthorized" />

    <div ref="scannerCardRef" class="card">
      <div class="toolbar">
        <h2>Scan QR</h2>
        <div class="actions">
          <button class="btn" :disabled="!isAuthorized || scanning" @click="startScan">Start</button>
          <button class="btn ghost" :disabled="!scanning" @click="stopScan">Stop</button>
        </div>
      </div>

      <div class="scanner-frame-wrap">
        <div :id="scannerElementId" class="scanner-frame" />
        <Transition name="scanner-popup-fade">
          <div v-if="hasPendingConfirmation" class="scanner-popup-backdrop">
            <div class="scanner-popup">
              <p class="scanner-popup-title">Подтвердить проход</p>
              <p class="scanner-popup-text">
                {{ pendingPreview?.guestName ?? "-" }}
              </p>
              <p class="scanner-popup-meta">Ticket: {{ pendingPreview?.uuid ?? "-" }}</p>
              <div class="confirm-actions">
                <button class="btn" :disabled="confirmLoading" @click="confirmCheckin">
                  Подтвердить
                </button>
                <button class="btn ghost" :disabled="confirmLoading" @click="cancelCheckin">
                  Отменить
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
      <p v-if="scanError" class="error-text">{{ scanError }}</p>

      <div :class="stateClass">
        <p class="scan-result-title">{{ resultTitle }}</p>
        <p class="scan-result-desc">{{ resultDescription }}</p>
        <p v-if="resultTicketId" class="scan-result-meta">
          Ticket: {{ resultTicketId }}
        </p>
      </div>
    </div>
  </section>
</template>
