import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/flags", () => ({ isNewLandingEnabled: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/settings", () => ({ getLimits: vi.fn() }));
vi.mock("@/lib/demo-repo", () => ({ findSession: vi.fn() }));
vi.mock("@/lib/usage", () => ({
  reserveGeneration: vi.fn(),
  releaseGeneration: vi.fn(),
  siteGenerationsToday: vi.fn().mockResolvedValue(0),
}));
vi.mock("@/lib/review-drafts", () => ({ writeReviewDrafts: vi.fn() }));
vi.mock("@/lib/place-snapshot", () => ({
  snapshotFromBusiness: vi.fn().mockReturnValue({ placeId: "ChIJabc", name: "Joe's", address: "", writeReviewUrl: "https://g.co/write", fetchedAt: "" }),
}));
vi.mock("@/lib/rate-limit", () => ({
  ipFromHeaders: vi.fn().mockReturnValue("1.2.3.4"),
  rateLimitKey: vi.fn().mockReturnValue("1.2.3.4:demo"),
  checkRateLimit: vi.fn().mockReturnValue(true),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import * as flags from "@/lib/flags";
import * as settings from "@/lib/settings";
import * as demoRepo from "@/lib/demo-repo";
import * as usage from "@/lib/usage";
import * as drafts from "@/lib/review-drafts";
import * as rateLimit from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { GenerationError } from "@/lib/generate-drafts";

const mockFlag = vi.mocked(flags.isNewLandingEnabled);
const mockLimits = vi.mocked(settings.getLimits);
const mockFindSession = vi.mocked(demoRepo.findSession);
const mockReserve = vi.mocked(usage.reserveGeneration);
const mockRelease = vi.mocked(usage.releaseGeneration);
const mockSite = vi.mocked(usage.siteGenerationsToday);
const mockDrafts = vi.mocked(drafts.writeReviewDrafts);
const mockCheck = vi.mocked(rateLimit.checkRateLimit);
const mockDb = db as unknown as Record<string, unknown>;

const LIMITS = {
  "assisted.dailyHandoffLimit": 6,
  "trial.generationLimit": 5,
  "trial.handoffLimit": 2,
  "demo.generationsPerPlace": 5,
  "demo.createsPerIpPerDay": 5,
  "demo.dailyGenerations": 200,
};

const PLACE = {
  placeId: "ChIJabc",
  name: "Joe's Pizza",
  writeReviewUrl: "https://g.co/write",
  details: null,
  detailsFetchedAt: null,
  generationsUsed: 1,
  generationLimit: null,
  blocked: false,
  createdAt: new Date(),
};

const SESSION = {
  id: "sess1",
  placeId: "ChIJabc",
  place: PLACE,
  ipHash: "hash",
  customInstructions: null,
  generations: 0,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 86_400_000),
};

const REVIEWS = [
  { id: "a", angle: "friendly", text: "Great pizza!" },
  { id: "b", angle: "detail", text: "Amazing crust." },
  { id: "c", angle: "quick", text: "Will be back." },
];

function makePost(id = "sess1"): NextRequest {
  return new NextRequest(`http://localhost/api/d/${id}/generate`, { method: "POST" });
}

beforeEach(() => {
  mockFlag.mockResolvedValue(true);
  mockLimits.mockResolvedValue(LIMITS);
  mockFindSession.mockResolvedValue(SESSION);
  mockReserve.mockResolvedValue(true);
  mockRelease.mockResolvedValue(undefined);
  mockSite.mockResolvedValue(0);
  mockDrafts.mockResolvedValue(REVIEWS);
  mockCheck.mockReturnValue(true);
  mockDb.demoPlace = { findUnique: vi.fn().mockResolvedValue({ ...PLACE, generationsUsed: 2 }) };
});

describe("POST /api/d/[id]/generate", () => {
  it("returns 404 when flag is off", async () => {
    mockFlag.mockResolvedValue(false);
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 404 when session does not exist", async () => {
    mockFindSession.mockResolvedValue(null);
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(404);
  });

  it("returns 410 when session is expired", async () => {
    mockFindSession.mockResolvedValue({
      ...SESSION,
      expiresAt: new Date(Date.now() - 1000),
    });
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({ error: "expired" });
  });

  it("returns 410 when shop is blocked", async () => {
    mockFindSession.mockResolvedValue({ ...SESSION, place: { ...PLACE, blocked: true } });
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(410);
    expect(await res.json()).toMatchObject({ error: "blocked" });
  });

  it("returns 429 when rate limited", async () => {
    mockCheck.mockReturnValue(false);
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(429);
  });

  it("returns 503 when site budget is spent", async () => {
    mockSite.mockResolvedValue(200);
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "busy" });
  });

  it("returns 409 when shop has no tries left", async () => {
    mockReserve.mockResolvedValue(false);
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "used_up" });
  });

  it("returns reviews, writeReviewUrl and triesLeft on success", async () => {
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reviews).toHaveLength(3);
    expect(body.writeReviewUrl).toBe("https://g.co/write");
    expect(typeof body.triesLeft).toBe("number");
  });

  it("releases the slot and returns 500 when generation fails", async () => {
    mockDrafts.mockRejectedValue(new GenerationError("fail"));
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    expect(res.status).toBe(500);
    expect(mockRelease).toHaveBeenCalledWith(expect.anything(), "sess1", "ChIJabc");
  });

  it("triesLeft decrements after a successful generation", async () => {
    mockDb.demoPlace = { findUnique: vi.fn().mockResolvedValue({ ...PLACE, generationsUsed: 3 }) };
    const res = await POST(makePost(), { params: Promise.resolve({ id: "sess1" }) });
    const body = await res.json();
    expect(body.triesLeft).toBe(2); // 5 - 3
  });
});
