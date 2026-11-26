import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ createTrialQr: vi.fn(), listOwned: vi.fn() }));
vi.mock("@/lib/places-details", () => ({ fetchPlaceDetails: vi.fn() }));
vi.mock("@/lib/settings", () => ({
  getLimits: vi.fn().mockResolvedValue({ "trial.generationLimit": 5, "trial.handoffLimit": 2 }),
}));

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { createTrialQr, listOwned } from "@/lib/business-repo";
import { fetchPlaceDetails } from "@/lib/places-details";
import { GET, POST } from "./route";

const mockSession = vi.mocked(getSessionUser);
const mockCreate = vi.mocked(createTrialQr);
const mockList = vi.mocked(listOwned);
const mockPlace = vi.mocked(fetchPlaceDetails);

const MARIA = { id: "usr_maria", name: "Maria", email: "maria@joespizza.com", role: "user" };
const SNAPSHOT = {
  placeId: "ChIJ_joes",
  name: "Joe's Pizza",
  address: "214 Mulberry St",
  writeReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ_joes",
  fetchedAt: "2026-11-27T00:00:00.000Z",
};

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/app/qr", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue(MARIA);
  mockPlace.mockResolvedValue(SNAPSHOT);
});

describe("POST /api/app/qr", () => {
  it("returns 401 when signed out", async () => {
    mockSession.mockResolvedValue(null);
    expect((await post({ placeId: "ChIJ_joes", plan: "trial" })).status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it.each(["basic", "assisted"])("refuses %s with payment_required until checkout exists", async (plan) => {
    const res = await post({ placeId: "ChIJ_joes", plan });
    expect(res.status).toBe(402);
    expect(await res.json()).toEqual({ error: "payment_required" });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a trial QR named after the Google place", async () => {
    mockCreate.mockResolvedValue({ id: "biz_1", slug: "joes-pizza-ab12" } as never);
    const res = await post({ placeId: "ChIJ_joes", plan: "trial", notes: "  Try the knots  " });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ id: "biz_1", slug: "joes-pizza-ab12" });
    expect(mockCreate).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        ownerId: "usr_maria",
        name: "Joe's Pizza",
        placeId: "ChIJ_joes",
        customInstructions: "Try the knots",
        writeReviewUrl: SNAPSHOT.writeReviewUrl,
      }),
    );
  });

  it("returns 409 when the account already used its trial", async () => {
    mockCreate.mockResolvedValue(null);
    const res = await post({ placeId: "ChIJ_joes", plan: "trial" });
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "trial_used" });
  });

  it("returns 502 when Google can't load the place", async () => {
    mockPlace.mockRejectedValue(new Error("Places API error 500"));
    expect((await post({ placeId: "ChIJ_joes", plan: "trial" })).status).toBe(502);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown plan", async () => {
    expect((await post({ placeId: "ChIJ_joes", plan: "gold" })).status).toBe(400);
  });
});

describe("GET /api/app/qr", () => {
  it("lists the caller's QRs with their plan", async () => {
    mockList.mockResolvedValue([
      {
        id: "biz_1",
        slug: "joes-pizza-ab12",
        name: "Joe's Pizza",
        sponsoredPlan: null,
        subscriptionStatus: null,
        cancelAtPeriodEnd: false,
        basicPaidAt: null,
        trialStartedAt: new Date(),
        trialGenerations: 1,
        trialHandoffs: 0,
      },
    ] as never);
    const res = await GET(new NextRequest("http://localhost/api/app/qr"));
    expect(mockList).toHaveBeenCalledWith({}, "usr_maria");
    expect(await res.json()).toEqual({
      qrs: [{ id: "biz_1", slug: "joes-pizza-ab12", name: "Joe's Pizza", plan: "trial" }],
    });
  });
});
