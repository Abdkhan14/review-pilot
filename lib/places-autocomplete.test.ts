import { describe, it, expect, vi, afterEach } from "vitest";
import { searchPlaces } from "./places-autocomplete";

vi.mock("server-only", () => ({}));

afterEach(() => vi.restoreAllMocks());

const SUGGESTIONS = {
  suggestions: [
    {
      placePrediction: {
        placeId: "ChIJabc123",
        structuredFormat: {
          mainText: { text: "Joe's Pizza" },
          secondaryText: { text: "123 Main St, Toronto, ON" },
        },
      },
    },
    {
      placePrediction: {
        placeId: "ChIJdef456",
        structuredFormat: {
          mainText: { text: "Joe's Tacos" },
          secondaryText: { text: "456 Elm St, Toronto, ON" },
        },
      },
    },
  ],
};

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    }),
  );
}

describe("searchPlaces", () => {
  it("maps Google suggestions to PlaceSuggestion[]", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
    mockFetch(SUGGESTIONS);

    const results = await searchPlaces("Joe", "tok-uuid-1234-5678-abcd");

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      placeId: "ChIJabc123",
      name: "Joe's Pizza",
      address: "123 Main St, Toronto, ON",
    });
  });

  it("returns an empty array when no suggestions", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
    mockFetch({ suggestions: [] });

    const results = await searchPlaces("xyz", "tok-uuid-5678-abcd-efgh");
    expect(results).toEqual([]);
  });

  it("throws when Google returns a non-2xx response", async () => {
    process.env.GOOGLE_MAPS_API_KEY = "test-key";
    mockFetch({ error: "API_KEY_INVALID" }, 400);

    await expect(searchPlaces("Joe", "tok-uuid-aaaa-bbbb-cccc")).rejects.toThrow(
      "Places Autocomplete error 400",
    );
  });

  it("throws when GOOGLE_MAPS_API_KEY is missing", async () => {
    delete process.env.GOOGLE_MAPS_API_KEY;
    await expect(searchPlaces("Joe", "tok-uuid-dddd-eeee-ffff")).rejects.toThrow(
      "GOOGLE_MAPS_API_KEY",
    );
  });
});
