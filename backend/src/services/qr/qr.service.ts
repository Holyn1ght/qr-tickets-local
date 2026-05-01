import QRCode from "qrcode";

export const generateQrDataUrl = async (value: string) => {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
  });
};
