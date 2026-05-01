import { http, type ApiEnvelope } from "./http";

export const verifyPin = async (pin: string) => {
  const response = await http.post<ApiEnvelope<{ authorized: boolean }>>("/auth/pin", { pin });
  return response.data.data.authorized;
};
