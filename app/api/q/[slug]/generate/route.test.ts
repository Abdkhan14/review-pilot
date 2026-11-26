import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ findOwnedBySlug: vi.fn() }));
vi.mock("@/lib/review-drafts", () => ({ writeReviewDrafts: vi.fn() }));
vi.mock("@/lib/usage", () => ({ reserveTrialGeneration: vi.fn(), releaseTrialGeneration: vi.fn() }));
vi.mock("@/lib/settings", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/settings")>()),
  getLimits: vi.fn(),
}));

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { findOwnedBySlug } from "@/lib/business-repo";
import { writeReviewDrafts } from "@/lib/review-drafts";
import { reserveTrialGeneration, releaseTrialGeneration } from "@/lib/usage";
import { DEFAULT_LIMITS, getLimits } from "@/lib/settings";
import { GenerationError } from "@/lib/generate-drafts";
import { resetRateLimitStore } from "@/lib/rate-limit";
import { POST } from "./route";

const mockFind = vi.mocked(findOwnedBySlug);
const mockSession = vi.mocked(getSessionUser);
const mockDrafts = vi.mocked(writeReviewDrafts);
const mockReserve = vi.mocked(reserveTrialGeneration);
const mockRelease = vi.mocked(releaseTrialGeneration);

const TODAY = new Date().toISOString().slice(0, 10);
const REVIEWS = [{ id: "a", angle: "x", text: "Great slice." }];

const TRIAL_QR = {
  id: "biz_1",
  slug: "joes-pizza-ab12",
  name: "Joe's Pizza",
  placeId: "ChIJ_joes",
  ownerId: "usr_maria",
  customInstructions: null,
  writeReviewUrl: "https://g/review",
  details: null,
  sponsoredPlan: null,
  subscriptionStatus: null,
  cancelAtPeriodEnd: false,
  basicPaidAt: null,
  trialStartedAt: new Date(),
  trialGenerations: 2,
  trialHandoffs: 0,
  dailyHandoffLimit: null,
  limitsDisabled: false,
  handoff: null,
};
const ASSISTED_QR = { ...TRIAL_QR, trialStartedAt: null, sponsoredPlan: "ASSISTED" };

function post(query = "") {
  const req = new NextRequest(`http://localhost/api/q/joes-pizza-ab12/generate${query}`, {
    method: "POST",
  });
  return POST(req, { params: Promise.resolve({ slug: "joes-pizza-ab12" }) });
}

beforeEach(() => {
  vi.clearAllMocks();
  resetRateLimitStore();
  vi.mocked(getLimits).mockResolvedValue(DEFAULT_LIMITS);
  mockSession.mockResolvedValue(null);
  mockDrafts.mockResolvedValue(REVIEWS);
  mockReserve.mockResolvedValue(true);
});

describe("POST /api/q/[slug]/generate", () => {
  it("returns 404 when no owned QR has this slug", async () => {
    mockFind.mockResolvedValue(null);
    expect((await post()).status).toBe(404);
  });

  it("uses a trial generation and reports the tries left", async () => {
    mockFind.mockResolvedValue(TRIAL_QR as never);
    const res = await post();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ reviews: REVIEWS, writeReviewUrl: "https://g/review", triesLeft: 2 });
    expect(mockReserve).toHaveBeenCalledWith({}, "biz_1", 5);
  });

  it("gives the trial generation back when writing drafts fails", async () => {
    mockFind.mockResolvedValue(TRIAL_QR as never);
    mockDrafts.mockRejectedValue(new GenerationError("bad json"));
    expect((await post()).status).toBe(500);
    expect(mockRelease).toHaveBeenCalledWith({}, "biz_1");
  });

  it("refuses when another scan just took the last trial generation", async () => {
    mockFind.mockResolvedValue(TRIAL_QR as never);
    mockReserve.mockResolvedValue(false);
    expect((await post()).status).toBe(403);
    expect(mockDrafts).not.toHaveBeenCalled();
  });

  it.each([
    ["Basic", { ...TRIAL_QR, basicPaidAt: new Date() }],
    ["inactive", { ...TRIAL_QR, trialHandoffs: 2 }],
  ])("refuses a %s QR", async (_name, qr) => {
    mockFind.mockResolvedValue(qr as never);
    expect((await post()).status).toBe(403);
    expect(mockDrafts).not.toHaveBeenCalled();
  });

  it("writes Assisted drafts without touching the trial counter", async () => {
    mockFind.mockResolvedValue(ASSISTED_QR as never);
    expect(await (await post()).json()).toEqual({ reviews: REVIEWS, writeReviewUrl: "https://g/review" });
    expect(mockReserve).not.toHaveBeenCalled();
  });

  it("returns daily_cap once Assisted reaches the QR's cap", async () => {
    mockFind.mockResolvedValue({ ...ASSISTED_QR, dailyHandoffLimit: 3, handoff: { count: 3, day: TODAY } } as never);
    const res = await post();
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ error: "daily_cap", retryAt: expect.any(Number) });
  });

  it("lets the owner run a test scan on an inactive QR without counting", async () => {
    mockFind.mockResolvedValue({ ...TRIAL_QR, trialHandoffs: 2 } as never);
    mockSession.mockResolvedValue({ id: "usr_maria", name: "M", email: "m@x.com", role: "user" });
    expect((await post("?testing=true")).status).toBe(200);
    expect(mockReserve).not.toHaveBeenCalled();
  });

  it("ignores testing=true from anyone else", async () => {
    mockFind.mockResolvedValue(TRIAL_QR as never);
    mockSession.mockResolvedValue({ id: "usr_other", name: "S", email: "s@x.com", role: "user" });
    await post("?testing=true");
    expect(mockReserve).toHaveBeenCalled();
  });
});
