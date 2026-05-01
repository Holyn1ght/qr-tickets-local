import { computed, ref } from "vue";
import axios from "axios";
import { verifyPin } from "../api/auth";

const storageKey = "qr_tickets_pin";

const pin = ref(localStorage.getItem(storageKey) ?? "");
const isAuthorized = ref(Boolean(pin.value));
const authError = ref("");
const loading = ref(false);

const savePin = (value: string) => {
  pin.value = value;
  localStorage.setItem(storageKey, value);
  isAuthorized.value = true;
};

const clearPin = () => {
  pin.value = "";
  isAuthorized.value = false;
  localStorage.removeItem(storageKey);
};

const authorize = async (candidatePin: string) => {
  loading.value = true;
  authError.value = "";
  try {
    const ok = await verifyPin(candidatePin);
    if (!ok) {
      authError.value = "Invalid PIN";
      isAuthorized.value = false;
      return false;
    }
    savePin(candidatePin);
    return true;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      authError.value = error.response?.data?.error?.message ?? "Authorization failed";
    } else {
      authError.value = "Authorization failed";
    }
    isAuthorized.value = false;
    return false;
  } finally {
    loading.value = false;
  }
};

export const usePinAuth = () => ({
  pin: computed(() => pin.value),
  isAuthorized: computed(() => isAuthorized.value),
  authError: computed(() => authError.value),
  loading: computed(() => loading.value),
  authorize,
  clearPin,
});
