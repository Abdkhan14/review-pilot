import { describe, it, expect } from "vitest";
import {
  newDemoId,
  hashIp,
  placeLimit,
  triesLeft,
  isExpired,
  DEMO_TTL_MS,
  PRUNE_AFTER_MS,
} from "./demo";
import type { AppLimits } from "./settings";

const LIMITS: AppLimits = {
  "assisted.dailyHandoffLimit": 6,
  "trial.generationLimit": 5,
  "trial.handoffLimit": 2,
  "demo.generationsPerPlace": 5,
  "demo.createsPerIpPerDay": 5,
  "demo.dailyGenerations": 200,
};

describe("newDemoId", () => {
  it("returns a 6-character base62 string", () => {
    const id = newDemoId();
    expect(id).toMatch(/^[0-9A-Za-z]{6}$/);
  });

  it("produces unique ids", () => {
    const ids = new Set(Array.from({ length: 50 }, () => newDemoId()));
    expect(ids.size).toBe(50);
  });
});

describe("hashIp", () => {
  it("returns a 64-char hex string", async () => {
    const h = await hashIp("1.2.3.4");
    expect(h).toMatch(/^[0-9a-f]{64}$/);
  });

  it("is deterministic", async () => {
    expect(await hashIp("1.2.3.4")).toBe(await hashIp("1.2.3.4"));
  });

  it("differs for different IPs", async () => {
    expect(await hashIp("1.2.3.4")).not.toBe(await hashIp("5.6.7.8"));
  });
});

describe("placeLimit", () => {
  it("returns generationLimit when set", () => {
    expect(placeLimit({ generationLimit: 10 }, LIMITS)).toBe(10);
  });

  it("falls back to demo.generationsPerPlace when null", () => {
    expect(placeLimit({ generationLimit: null }, LIMITS)).toBe(5);
  });
});

describe("triesLeft", () => {
  it("returns remaining tries", () => {
    expect(triesLeft({ generationsUsed: 2, generationLimit: null }, LIMITS)).toBe(3);
  });

  it("never goes below 0", () => {
    expect(triesLeft({ generationsUsed: 99, generationLimit: null }, LIMITS)).toBe(0);
  });
});

describe("isExpired", () => {
  it("returns false before expiry", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + DEMO_TTL_MS);
    expect(isExpired({ expiresAt }, now)).toBe(false);
  });

  it("returns true after expiry", () => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() - 1);
    expect(isExpired({ expiresAt }, now)).toBe(true);
  });
});

describe("constants", () => {
  it("DEMO_TTL_MS is 24 hours", () => {
    expect(DEMO_TTL_MS).toBe(86_400_000);
  });

  it("PRUNE_AFTER_MS is 2 days", () => {
    expect(PRUNE_AFTER_MS).toBe(172_800_000);
  });
});
