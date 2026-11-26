import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ findOwned: vi.fn(), updateQr: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/places-details", () => ({ fetchPlaceDetails: vi.fn() }));
vi.mock("@/lib/settings", () => ({
  getLimits: vi.fn().mockResolvedValue({ "trial.generationLimit": 5, "trial.handoffLimit": 2 }),
}));

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { findOwned, remove, updateQr } from "@/lib/business-repo";
import { fetchPlaceDetails } from "@/lib/places-details";
import { DELETE, GET, PATCH } from "./route";

const mockSession = vi.mocked(getSessionUser);
const mockFindOwned = vi.mocked(findOwned);
const mockUpdate = vi.mocked(updateQr);
const mockRemove = vi.mocked(remove);
const mockPlace = vi.mocked(fetchPlaceDetails);

const MARIA = { id: "usr_maria", name: "Maria", email: "maria@joespizza.com", role: "user" };
const QR = {
  id: "biz_1",
  slug: "joes-pizza-ab12",
  name: "Joe's Pizza",
  placeId: "ChIJ_joes",
  ownerId: "usr_maria",
  sponsoredPlan: null,
  subscriptionStatus: null,
  cancelAtPeriodEnd: false,
  basicPaidAt: null,
  trialStartedAt: new Date(),
  trialGenerations: 0,
  trialHandoffs: 0,
};

const ctx = { params: Promise.resolve({ id: "biz_1" }) };
const req = (method: string, body?: unknown) =>
  new NextRequest("http://localhost/api/app/qr/biz_1", {
    method,
    ...(body === undefined
      ? {}
      : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockSession.mockResolvedValue(MARIA);
  mockFindOwned.mockResolvedValue(QR as never);
});

describe("/api/app/qr/[id]", () => {
  it("returns 401 when signed out", async () => {
    mockSession.mockResolvedValue(null);
    expect((await GET(req("GET"), ctx)).status).toBe(401);
  });

  it.each([
    ["GET", () => GET(req("GET"), ctx)],
    ["PATCH", () => PATCH(req("PATCH", { customInstructions: "x" }), ctx)],
    ["DELETE", () => DELETE(req("DELETE"), ctx)],
  ])("%s returns 404 for a QR the caller doesn't own", async (_method, call) => {
    mockFindOwned.mockResolvedValue(null);
    expect((await call()).status).toBe(404);
    expect(mockFindOwned).toHaveBeenCalledWith({}, "biz_1", "usr_maria");
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("GET returns the QR with its plan", async () => {
    expect(await (await GET(req("GET"), ctx)).json()).toEqual({
      id: "biz_1",
      slug: "joes-pizza-ab12",
      name: "Joe's Pizza",
      plan: "trial",
    });
  });

  it("PATCH saves trimmed shop notes and clears them when blank", async () => {
    mockUpdate.mockResolvedValue({ customInstructions: "Try the knots" } as never);
    await PATCH(req("PATCH", { customInstructions: "  Try the knots " }), ctx);
    expect(mockUpdate).toHaveBeenLastCalledWith({}, "biz_1", { customInstructions: "Try the knots" });

    await PATCH(req("PATCH", { customInstructions: "   " }), ctx);
    expect(mockUpdate).toHaveBeenLastCalledWith({}, "biz_1", { customInstructions: null });
  });

  it("PATCH refreshPlace saves fresh Google info", async () => {
    mockPlace.mockResolvedValue({ name: "Joe's Pizza", writeReviewUrl: "https://g/new" } as never);
    mockUpdate.mockResolvedValue({} as never);
    await PATCH(req("PATCH", { refreshPlace: true }), ctx);
    expect(mockPlace).toHaveBeenCalledWith("ChIJ_joes");
    expect(mockUpdate).toHaveBeenCalledWith(
      {},
      "biz_1",
      expect.objectContaining({ writeReviewUrl: "https://g/new", detailsFetchedAt: expect.any(Date) }),
    );
  });

  it("PATCH returns 400 when there is nothing to update", async () => {
    expect((await PATCH(req("PATCH", {}), ctx)).status).toBe(400);
  });

  it("DELETE removes the QR", async () => {
    expect((await DELETE(req("DELETE"), ctx)).status).toBe(204);
    expect(mockRemove).toHaveBeenCalledWith({}, "biz_1");
  });
});
