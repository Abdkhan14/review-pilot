import { describe, it, expect } from "vitest";
import { safeCallbackUrl } from "./callback-url";

describe("safeCallbackUrl", () => {
  it("keeps a path on this site", () => {
    expect(safeCallbackUrl("/admin/demos?tab=1")).toBe("/admin/demos?tab=1");
  });

  it("falls back to /app when missing", () => {
    expect(safeCallbackUrl(undefined)).toBe("/app");
  });

  it.each(["https://evil.example", "//evil.example", "/\\evil.example", "app"])(
    "falls back to /app for %s",
    (raw) => {
      expect(safeCallbackUrl(raw)).toBe("/app");
    },
  );
});
