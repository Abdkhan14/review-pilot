import "server-only";
import QRCode from "qrcode";

// M-level error correction — recovers up to 15% damage; good balance for a
// printed sticker. Use "H" (30%) if the sticker will be small or in a busy env.
const QR_OPTIONS: QRCode.QRCodeToBufferOptions & QRCode.QRCodeToStringOptions = {
  errorCorrectionLevel: "M",
  margin: 4, // quiet zone (modules)
  color: { dark: "#000000", light: "#FFFFFF" },
};

function assertUrl(url: string): void {
  if (!url.trim()) throw new Error("url must not be empty");
}

export async function encodeQrPng(url: string): Promise<Buffer> {
  assertUrl(url);
  return QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png" });
}

export async function encodeQrSvg(url: string): Promise<string> {
  assertUrl(url);
  return QRCode.toString(url, { ...QR_OPTIONS, type: "svg" });
}
