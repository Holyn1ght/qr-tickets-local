import { http, type ApiEnvelope } from "./http";
import type { CheckinPreviewResponse, CheckinResponse } from "../types/ticket";

export const checkin = async (qrData: string) => {
  const response = await http.post<ApiEnvelope<CheckinResponse>>("/checkin", { qrData });
  return response.data.data;
};

export const previewCheckin = async (qrData: string) => {
  const response = await http.post<ApiEnvelope<CheckinPreviewResponse>>("/checkin/preview", {
    qrData,
  });
  return response.data.data;
};
