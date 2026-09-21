import { describe, it, expect } from "vitest";
import { buildScanUrl } from "./scan-url";

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
