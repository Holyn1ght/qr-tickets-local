import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "/api";

export const http = axios.create({
  baseURL: apiBaseUrl,
});

http.interceptors.request.use((config) => {
  const pin = localStorage.getItem("qr_tickets_pin");
  if (pin) {
    config.headers.set("x-pin", pin);
  }
  return config;
});

export type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { message: string } | null;
};
