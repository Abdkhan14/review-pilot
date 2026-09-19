import { describe, it, expect, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { encodeQrPng, encodeQrSvg } from "./encode-qr";

const FIXTURE_URL = "https://example.com/b/joes-pizza-ab12";

// PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("encodeQrPng", () => {
  it("returns a non-empty Buffer", async () => {
    const buf = await encodeQrPng(FIXTURE_URL);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("starts with PNG magic bytes", async () => {
    const buf = await encodeQrPng(FIXTURE_URL);
    expect(buf.slice(0, 8)).toEqual(PNG_MAGIC);
  });

  it("throws when url is empty", async () => {
    await expect(encodeQrPng("")).rejects.toThrow(/url/i);
  });

  it("throws when url is whitespace only", async () => {
    await expect(encodeQrPng("   ")).rejects.toThrow(/url/i);
  });
});

describe("encodeQrSvg", () => {
  it("returns a non-empty string", async () => {
    const svg = await encodeQrSvg(FIXTURE_URL);
    expect(typeof svg).toBe("string");
    expect(svg.length).toBeGreaterThan(0);
  });

  it("returns a valid SVG with our QR colors applied", async () => {
    // qrcode encodes the URL as a path, not as embedded text.
    // Verify the SVG structure and that our color options were applied.
    const svg = await encodeQrSvg(FIXTURE_URL);
    expect(svg).toContain("<svg");
    expect(svg).toContain("#000000"); // dark modules
    expect(svg).toContain("#FFFFFF"); // quiet zone / light modules
  });

  it("throws when url is empty", async () => {
    await expect(encodeQrSvg("")).rejects.toThrow(/url/i);
  });

  it("throws when url is whitespace only", async () => {
    await expect(encodeQrSvg("   ")).rejects.toThrow(/url/i);
  });
});
