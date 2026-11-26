import { describe, it, expect } from "vitest";
import { buildScanUrl, buildDemoUrl, buildQrUrl, scanUrlFor } from "./scan-url";

describe("buildScanUrl", () => {
  it("combines origin and slug into a /b/ URL", () => {
    expect(buildScanUrl("https://example.com", "joes-pizza-ab12")).toBe(
      "https://example.com/b/joes-pizza-ab12"
    );
  });

  it("strips a trailing slash from the origin", () => {
    expect(buildScanUrl("https://example.com/", "joes-pizza-ab12")).toBe(
      "https://example.com/b/joes-pizza-ab12"
    );
  });

  it("throws when slug is empty", () => {
    expect(() => buildScanUrl("https://example.com", "")).toThrow(/slug/i);
  });

  it("throws when slug is whitespace only", () => {
    expect(() => buildScanUrl("https://example.com", "   ")).toThrow(/slug/i);
  });

  it("throws when origin is empty", () => {
    expect(() => buildScanUrl("", "joes-pizza-ab12")).toThrow(/origin/i);
  });
});

describe("buildDemoUrl", () => {
  it("combines origin and id into a /d/ URL", () => {
    expect(buildDemoUrl("https://example.com", "k7Hq2p")).toBe(
      "https://example.com/d/k7Hq2p",
    );
  });

  it("strips a trailing slash from the origin", () => {
    expect(buildDemoUrl("https://example.com/", "k7Hq2p")).toBe(
      "https://example.com/d/k7Hq2p",
    );
  });

  it("throws when id is empty", () => {
    expect(() => buildDemoUrl("https://example.com", "")).toThrow(/id/i);
  });
});

describe("buildQrUrl", () => {
  it("combines origin and slug into a /q/ URL", () => {
    expect(buildQrUrl("https://example.com/", "joes-pizza-ab12")).toBe(
      "https://example.com/q/joes-pizza-ab12",
    );
  });
});

describe("scanUrlFor", () => {
  it("uses /q/ for an owned QR and /b/ for one made in admin", () => {
    expect(scanUrlFor("https://example.com", { slug: "joes-ab12", ownerId: "usr_1" })).toBe(
      "https://example.com/q/joes-ab12",
    );
    expect(scanUrlFor("https://example.com", { slug: "sunrise-1a2b", ownerId: null })).toBe(
      "https://example.com/b/sunrise-1a2b",
    );
  });
});
