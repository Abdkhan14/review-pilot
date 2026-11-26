import "server-only";
import { NextResponse } from "next/server";
import { encodeQrPng, encodeQrSvg } from "@/lib/encode-qr";

export type QrFormat = "png" | "svg";

export function parseQrFormat(value: string | null): QrFormat | null {
  return value === "png" || value === "svg" ? value : null;
}

/** The QR code for `url` as a file download named `{filename}.{format}`. */
export async function qrFileResponse(
  url: string,
  filename: string,
  format: QrFormat,
): Promise<NextResponse> {
  const disposition = `attachment; filename="${filename}.${format}"`;
  if (format === "png") {
    const png = await encodeQrPng(url);
    return new NextResponse(new Uint8Array(png), {
      headers: { "Content-Type": "image/png", "Content-Disposition": disposition },
    });
  }
  return new NextResponse(await encodeQrSvg(url), {
    headers: { "Content-Type": "image/svg+xml", "Content-Disposition": disposition },
  });
}
