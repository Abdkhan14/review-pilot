import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/flags", () => ({ isNewLandingEnabled: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/settings", () => ({ getLimits: vi.fn() }));
vi.mock("@/lib/places-details", () => ({ fetchPlaceDetails: vi.fn() }));
vi.mock("@/lib/encode-qr", () => ({ encodeQrSvg: vi.fn().mockResolvedValue("<svg/>") }));
vi.mock("@/lib/rate-limit", () => ({
  ipFromHeaders: vi.fn().mockReturnValue("1.2.3.4"),
  rateLimitKey: vi.fn().mockReturnValue("1.2.3.4:demo"),
  checkRateLimit: vi.fn().mockReturnValue(true),
}));
vi.mock("@/lib/demo", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/demo")>();
  return {
    ...actual,
    hashIp: vi.fn().mockResolvedValue("hashed-ip"),
  };
});
vi.mock("@/lib/demo-repo", () => ({
  findOrCreatePlace: vi.fn(),
  createSession: vi.fn(),
  pruneSessions: vi.fn(),
}));
vi.mock("@/lib/usage", () => ({
  visitorSessionsToday: vi.fn().mockResolvedValue(0),
  siteGenerationsToday: vi.fn().mockResolvedValue(0),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import * as flags from "@/lib/flags";
import * as settings from "@/lib/settings";
import * as placesDetails from "@/lib/places-details";
import * as demoRepo from "@/lib/demo-repo";
import * as usage from "@/lib/usage";
import * as rateLimit from "@/lib/rate-limit";

const mockFlag = vi.mocked(flags.isNewLandingEnabled);
const mockLimits = vi.mocked(settings.getLimits);
const mockFetchPlace = vi.mocked(placesDetails.fetchPlaceDetails);
const mockFindOrCreate = vi.mocked(demoRepo.findOrCreatePlace);
const mockCreateSession = vi.mocked(demoRepo.createSession);
const mockPrune = vi.mocked(demoRepo.pruneSessions);
const mockVisitor = vi.mocked(usage.visitorSessionsToday);
const mockSite = vi.mocked(usage.siteGenerationsToday);
const mockCheck = vi.mocked(rateLimit.checkRateLimit);

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
  generationsUsed: 0,
  generationLimit: null,
  blocked: false,
  createdAt: new Date(),
};

const SESSION = {
  id: "abc123",
  placeId: "ChIJabc",
  ipHash: "hashed-ip",
  customInstructions: null,
  generations: 0,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 86_400_000),
};

function makePost(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/demo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// Needed because db.demoPlace.findUnique is called directly
import { db } from "@/lib/db";
const mockDb = db as unknown as Record<string, unknown>;

beforeEach(() => {
  mockFlag.mockResolvedValue(true);
  mockLimits.mockResolvedValue(LIMITS);
  mockFindOrCreate.mockResolvedValue(PLACE);
  mockCreateSession.mockResolvedValue(SESSION);
  mockPrune.mockResolvedValue(undefined);
  mockVisitor.mockResolvedValue(0);
  mockSite.mockResolvedValue(0);
  mockCheck.mockReturnValue(true);
  mockFetchPlace.mockResolvedValue({
    placeId: "ChIJabc",
    name: "Joe's Pizza",
    address: "123 Main",
    writeReviewUrl: "https://g.co/write",
    fetchedAt: "2026-01-01T00:00:00Z",
  });

  // Mock db.demoPlace.findUnique to return null (place not known yet)
  mockDb.demoPlace = { findUnique: vi.fn().mockResolvedValue(null) };
});

describe("POST /api/demo", () => {
  it("returns 404 when flag is off", async () => {
    mockFlag.mockResolvedValue(false);
    const res = await POST(makePost({ placeId: "ChIJabc" }));
    expect(res.status).toBe(404);
  });

  it("returns 429 when rate limited", async () => {
    mockCheck.mockReturnValue(false);
    const res = await POST(makePost({ placeId: "ChIJabc" }));
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: "rate_limited" });
  });

  it("returns 400 for invalid body", async () => {
    const res = await POST(makePost({ placeId: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 403 when place is blocked", async () => {
    mockDb.demoPlace = { findUnique: vi.fn().mockResolvedValue({ ...PLACE, blocked: true }) };
    const res = await POST(makePost({ placeId: "ChIJabc" }));
    expect(res.status).toBe(403);
    // Blocked shop check must run before Google call
    expect(mockFindOrCreate).not.toHaveBeenCalled();
  });

  it("returns 429 visitor_limit when visitor has 5 links today", async () => {
    mockVisitor.mockResolvedValue(5);
    const res = await POST(makePost({ placeId: "ChIJabc" }));
    expect(res.status).toBe(429);
    expect(await res.json()).toMatchObject({ error: "visitor_limit" });
  });

  it("returns 503 busy when site budget is spent", async () => {
    mockSite.mockResolvedValue(200);
    const res = await POST(makePost({ placeId: "ChIJabc" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ error: "busy" });
  });

  it("returns 502 when Google place fetch fails", async () => {
    mockFindOrCreate.mockRejectedValue(new Error("Google down"));
    const res = await POST(makePost({ placeId: "ChIJabc" }));
    expect(res.status).toBe(502);
  });

  it("returns 409 used_up when shop has no tries left", async () => {
    mockFindOrCreate.mockResolvedValue({ ...PLACE, generationsUsed: 5 });
    const res = await POST(makePost({ placeId: "ChIJabc" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "used_up" });
  });

  it("returns session data on success", async () => {
    const res = await POST(makePost({ placeId: "ChIJabc", notes: "great food" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBe("abc123");
    expect(body.name).toBe("Joe's Pizza");
    expect(body).toHaveProperty("assistedUrl");
    expect(body).toHaveProperty("basicUrl");
    expect(body).toHaveProperty("assistedQrSvg");
    expect(body).toHaveProperty("basicQrSvg");
    expect(body).toHaveProperty("triesLeft");
    expect(body).toHaveProperty("expiresAt");
  });
});
