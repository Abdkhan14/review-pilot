import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ create: vi.fn(), list: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/places-details", () => ({ fetchPlaceDetails: vi.fn() }));

import { getSessionUser } from "@/lib/session";
import * as repo from "@/lib/business-repo";
import * as placesDetails from "@/lib/places-details";
import { NextRequest } from "next/server";
import { GET, POST } from "./route";

const mockSession = vi.mocked(getSessionUser);
const ADMIN = { id: "u1", name: "Admin", email: "admin@example.com", role: "admin" };
const USER = { id: "u2", name: "Maria", email: "maria@joespizza.com", role: "user" };
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

function makeGet(): NextRequest {
  return new NextRequest("http://localhost/api/admin/businesses");
}

function postBody(body: unknown): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const req = new NextRequest("http://localhost/api/admin/businesses", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("GET /api/admin/businesses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(null);
  });

  it("returns 401 when signed out", async () => {
    const res = await GET(makeGet());
    expect(res.status).toBe(401);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-in non-admin", async () => {
    mockSession.mockResolvedValue(USER);
    const res = await GET(makeGet());
    expect(res.status).toBe(403);
    expect(mockList).not.toHaveBeenCalled();
  });

  it("returns 200 with an empty array when there are no rows", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockList.mockResolvedValue([]);
    const res = await GET(makeGet());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it("returns 200 with name, tier, slug for each row", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockList.mockResolvedValue([
      { id: "cuid1", slug: "joes-pizza-ab12", name: "Joe's Pizza", tier: "BASIC", placeId: "ChIJ123", customInstructions: null, details: null, detailsFetchedAt: null, createdAt: new Date() } as any,
    ]);
    const res = await GET(makeGet());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({ name: "Joe's Pizza", tier: "BASIC", slug: "joes-pizza-ab12" });
  });
});

describe("POST /api/admin/businesses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(null);
  });

  it("returns 401 when signed out", async () => {
    const res = await postBody({ name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" });
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-in non-admin", async () => {
    mockSession.mockResolvedValue(USER);
    const res = await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" }
    );
    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing name", async () => {
    mockSession.mockResolvedValue(ADMIN);
    const res = await postBody({ placeId: "ChIJ123", tier: "BASIC" });
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing placeId", async () => {
    mockSession.mockResolvedValue(ADMIN);
    const res = await postBody({ name: "Joe's Pizza", tier: "BASIC" });
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing tier", async () => {
    mockSession.mockResolvedValue(ADMIN);
    const res = await postBody({ name: "Joe's Pizza", placeId: "ChIJ123" });
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 201, calls create without slug, returns the server slug", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFetchPlaceDetails.mockResolvedValue(MOCK_SNAPSHOT as any);
    mockCreate.mockResolvedValue({ slug: "joes-pizza-ab12" } as any);

    const res = await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC", slug: "client-slug" }
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ slug: "joes-pizza-ab12" });

    const [, callInput] = mockCreate.mock.calls[0];
    expect(callInput).not.toHaveProperty("slug");
  });

  it("persists writeReviewUrl, details, and detailsFetchedAt from Places snapshot", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFetchPlaceDetails.mockResolvedValue(MOCK_SNAPSHOT as any);
    mockCreate.mockResolvedValue({ slug: "joes-pizza-ab12" } as any);

    await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" }
    );

    const [, callInput] = mockCreate.mock.calls[0];
    expect(callInput.writeReviewUrl).toBe(MOCK_SNAPSHOT.writeReviewUrl);
    expect(JSON.parse(callInput.details!)).toMatchObject({ placeId: "ChIJ123" });
    expect(callInput.detailsFetchedAt).toBeInstanceOf(Date);
  });

  it("returns 502 when Places API call fails", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFetchPlaceDetails.mockRejectedValue(new Error("Places API error 400"));

    const res = await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" }
    );

    expect(res.status).toBe(502);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});
