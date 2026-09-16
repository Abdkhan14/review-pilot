import { describe, it, expect } from "vitest";
import { resolveDbTarget } from "./db-target";

describe("resolveDbTarget", () => {
  it("returns file when Turso vars are absent", () => {
    expect(resolveDbTarget({})).toEqual({ kind: "file" });
  });

  it("returns turso with url and token when both vars are set", () => {
    expect(
      resolveDbTarget({
        TURSO_DATABASE_URL: "libsql://example.turso.io",
        TURSO_AUTH_TOKEN: "tok_abc123",
      })
    ).toEqual({
      kind: "turso",
      url: "libsql://example.turso.io",
      token: "tok_abc123",
    });
  });

  it("throws when only TURSO_DATABASE_URL is set", () => {
    expect(() =>
      resolveDbTarget({ TURSO_DATABASE_URL: "libsql://example.turso.io" })
    ).toThrow(/TURSO_AUTH_TOKEN/);
  });

  it("throws when only TURSO_AUTH_TOKEN is set", () => {
    expect(() =>
      resolveDbTarget({ TURSO_AUTH_TOKEN: "tok_abc123" })
    ).toThrow(/TURSO_DATABASE_URL/);
  });
});
