import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

// Mock fetch globally before importing the module under test.
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import { fetchPlaceDetails } from "./places-details";

const PLACE_ID = "ChIJhUnH0T7U1IkR6N_N0K0P67M";

const OK_BODY = {
  id: PLACE_ID,
  displayName: { text: "Joe's Pizza" },
  formattedAddress: "123 Main St, Brooklyn, NY",
  primaryType: "pizza_restaurant",
  rating: 4.6,
  userRatingCount: 1284,
  editorialSummary: { text: "Thin-crust slice shop." },
  reviews: [],
  googleMapsLinks: {
    writeAReviewUri: "https://www.google.com/maps/place//data=!4m3!3m2!1s0xABC!12e1",
  },
};

function mockOk(body: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => body,
  } as Response);
}

function mockError(status: number) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    text: async () => "Bad Request",
  } as unknown as Response);
}

describe("fetchPlaceDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
  });

  it("returns a normalized snapshot on success", async () => {
    mockOk(OK_BODY);
    const snap = await fetchPlaceDetails(PLACE_ID);
    expect(snap.placeId).toBe(PLACE_ID);
    expect(snap.writeReviewUrl).toContain("google.com/maps");
    expect(snap.name).toBe("Joe's Pizza");
  });

  it("sends the correct field mask header", async () => {
    mockOk(OK_BODY);
    await fetchPlaceDetails(PLACE_ID);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Goog-FieldMask"]).toContain("googleMapsLinks.writeAReviewUri");
  });

  it("includes the placeId in the URL", async () => {
    mockOk(OK_BODY);
    await fetchPlaceDetails(PLACE_ID);
    const [url] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(PLACE_ID);
  });

  it("throws when GOOGLE_MAPS_API_KEY is not set", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    await expect(fetchPlaceDetails(PLACE_ID)).rejects.toThrow(/GOOGLE_MAPS_API_KEY/);
  });

  it("throws on non-2xx response", async () => {
    mockError(400);
    await expect(fetchPlaceDetails(PLACE_ID)).rejects.toThrow(/400/);
  });

  it("throws when writeAReviewUri is absent in the response", async () => {
    mockOk({ ...OK_BODY, googleMapsLinks: {} });
    await expect(fetchPlaceDetails(PLACE_ID)).rejects.toThrow(/writeAReviewUri/i);
  });
});
