import { vi, describe, it, expect, beforeAll } from "vitest";

// Stub server-only before importing auth (same trick as db.test.ts)
vi.mock("server-only", () => ({}));

import { timingSafeEqual, signSession, verifySession } from "./auth";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-at-least-32-chars-long!!";
});

describe("timingSafeEqual", () => {
  it("returns true when strings match", () => {
    expect(timingSafeEqual("correct-password", "correct-password")).toBe(true);
  });

  it("returns false when strings differ", () => {
    expect(timingSafeEqual("correct-password", "wrong-password")).toBe(false);
  });

  it("returns false for strings of different length", () => {
    expect(timingSafeEqual("short", "this-is-much-longer")).toBe(false);
  });
});

describe("signSession / verifySession", () => {
  it("round-trips a valid payload", async () => {
    const token = await signSession({ role: "admin" });
    expect(typeof token).toBe("string");
    const payload = await verifySession(token);
    expect(payload).toMatchObject({ role: "admin" });
  });

  it("throws on a tampered token", async () => {
    const bad = "eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiYWRtaW4ifQ.bad_signature";
    await expect(verifySession(bad)).rejects.toThrow();
  });

  it("throws on an expired token", async () => {
    const expired = await signSession({ role: "admin" }, "-1s");
    await expect(verifySession(expired)).rejects.toThrow();
  });
});
