import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ verifySession: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ create: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/places-details", () => ({ fetchPlaceDetails: vi.fn() }));

import * as auth from "@/lib/auth";
import * as repo from "@/lib/business-repo";
import * as placesDetails from "@/lib/places-details";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

const mockVerify = vi.mocked(auth.verifySession);
const mockCreate = vi.mocked(repo.create);
const mockList = vi.mocked(repo.list);
const mockFetchPlaceDetails = vi.mocked(placesDetails.fetchPlaceDetails);

const MOCK_SNAPSHOT = {
  placeId: "ChIJ123",
  name: "Joe's Pizza",
  address: "123 Main St",
  primaryType: "pizza_restaurant",
  rating: 4.6,
  userRatingCount: 100,
  writeReviewUrl: "https://www.google.com/maps/place//data=!review",
  reviews: [],
  fetchedAt: "2026-09-20T00:00:00.000Z",
};

function makeGet(cookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (cookie) headers["cookie"] = `${ADMIN_COOKIE}=${cookie}`;
  return new NextRequest("http://localhost/api/admin/businesses", { headers });
}

function postBody(body: unknown, cookie?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["cookie"] = `${ADMIN_COOKIE}=${cookie}`;
  const req = new NextRequest("http://localhost/api/admin/businesses", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("GET /api/admin/businesses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without cookie", async () => {
    const res = await GET(makeGet());
    expect(res.status).toBe(401);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("returns 401 with an invalid cookie", async () => {
    mockVerify.mockRejectedValue(new Error("bad token"));
    const res = await GET(makeGet("bad-token"));
    expect(res.status).toBe(401);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("returns 200 with an empty array when there are no rows", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockList.mockResolvedValue([]);
    const res = await GET(makeGet("valid-token"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 200 with name, tier, slug for each row", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockList.mockResolvedValue([
      { id: "cuid1", slug: "joes-pizza-ab12", name: "Joe's Pizza", tier: "BASIC", placeId: "ChIJ123", customInstructions: null, details: null, detailsFetchedAt: null, createdAt: new Date() } as any,
    ]);
    const res = await GET(makeGet("valid-token"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ name: "Joe's Pizza", tier: "BASIC", slug: "joes-pizza-ab12" });
  });
});

describe("POST /api/admin/businesses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without cookie", async () => {
    const res = await postBody({ name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" });
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 401 with an invalid cookie", async () => {
    mockVerify.mockRejectedValue(new Error("bad token"));
    const res = await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" },
      "bad-token"
    );
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing name", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await postBody({ placeId: "ChIJ123", tier: "BASIC" }, "valid-token");
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing placeId", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await postBody({ name: "Joe's Pizza", tier: "BASIC" }, "valid-token");
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing tier", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await postBody({ name: "Joe's Pizza", placeId: "ChIJ123" }, "valid-token");
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 201, calls create without slug, returns the server slug", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFetchPlaceDetails.mockResolvedValue(MOCK_SNAPSHOT as any);
    mockCreate.mockResolvedValue({ slug: "joes-pizza-ab12" } as any);

    const res = await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC", slug: "client-slug" },
      "valid-token"
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ slug: "joes-pizza-ab12" });

    const [, callInput] = mockCreate.mock.calls[0];
    expect(callInput).not.toHaveProperty("slug");
  });

  it("persists writeReviewUrl, details, and detailsFetchedAt from Places snapshot", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFetchPlaceDetails.mockResolvedValue(MOCK_SNAPSHOT as any);
    mockCreate.mockResolvedValue({ slug: "joes-pizza-ab12" } as any);

    await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" },
      "valid-token"
    );

    const [, callInput] = mockCreate.mock.calls[0];
    expect(callInput.writeReviewUrl).toBe(MOCK_SNAPSHOT.writeReviewUrl);
    expect(JSON.parse(callInput.details!)).toMatchObject({ placeId: "ChIJ123" });
    expect(callInput.detailsFetchedAt).toBeInstanceOf(Date);
  });

  it("returns 502 when Places API call fails", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFetchPlaceDetails.mockRejectedValue(new Error("Places API error 400"));

    const res = await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" },
      "valid-token"
    );

    expect(res.status).toBe(502);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
