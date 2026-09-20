import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  ipFromHeaders,
  rateLimitKey,
  resetRateLimitStore,
} from "./rate-limit";

beforeEach(() => resetRateLimitStore());

describe("checkRateLimit", () => {
  it("allows requests within the limit", () => {
    const key = "1.2.3.4:shop-abc";
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { limit: 5, windowMs: 30_000 })).toBe(true);
    }
  });

  it("blocks the 6th request that exceeds the limit", () => {
    const key = "1.2.3.4:shop-abc";
    for (let i = 0; i < 5; i++) checkRateLimit(key, { limit: 5, windowMs: 30_000 });
    expect(checkRateLimit(key, { limit: 5, windowMs: 30_000 })).toBe(false);
  });

  it("a different key is still allowed after another key is exhausted", () => {
    const keyA = "1.2.3.4:shop-abc";
    const keyB = "1.2.3.4:shop-xyz";
    for (let i = 0; i < 5; i++) checkRateLimit(keyA, { limit: 5, windowMs: 30_000 });
    expect(checkRateLimit(keyB, { limit: 5, windowMs: 30_000 })).toBe(true);
  });

  it("allows again after the window expires", async () => {
    const key = "1.2.3.4:shop-abc";
    for (let i = 0; i < 5; i++) checkRateLimit(key, { limit: 5, windowMs: 1 });
    // Wait for the 1ms window to expire
    await new Promise((r) => setTimeout(r, 10));
    expect(checkRateLimit(key, { limit: 5, windowMs: 1 })).toBe(true);
  });
});

describe("ipFromHeaders", () => {
  it("returns first x-forwarded-for value", () => {
    const h = new Headers({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    expect(ipFromHeaders(h)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "9.9.9.9" });
    expect(ipFromHeaders(h)).toBe("9.9.9.9");
  });

  it("returns unknown when no IP header present", () => {
    expect(ipFromHeaders(new Headers())).toBe("unknown");
  });
});

describe("rateLimitKey", () => {
  it("combines ip and slug with a colon", () => {
    expect(rateLimitKey("1.2.3.4", "shop-abc")).toBe("1.2.3.4:shop-abc");
  });
});
