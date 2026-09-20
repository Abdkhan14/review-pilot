import { describe, it, expect } from "vitest";
import { normalizePlaceSnapshot } from "./place-snapshot";

// Minimal fixture that mirrors the Places API (New) response shape.
const FIXTURE = {
  id: "ChIJhUnH0T7U1IkR6N_N0K0P67M",
  displayName: { text: "Joe's Pizza" },
  formattedAddress: "123 Main St, Brooklyn, NY 11201, USA",
  primaryType: "pizza_restaurant",
  primaryTypeDisplayName: { text: "Pizza Restaurant" },
  rating: 4.6,
  userRatingCount: 1284,
  editorialSummary: { text: "Thin-crust slice shop." },
  reviews: [
    {
      rating: 5,
      text: { text: "Best pepperoni in the neighborhood." },
      relativePublishTimeDescription: "2 months ago",
    },
  ],
  googleMapsLinks: {
    writeAReviewUri:
      "https://www.google.com/maps/place//data=!4m3!3m2!1s0xABC!12e1",
  },
};

describe("normalizePlaceSnapshot", () => {
  it("extracts writeReviewUrl from googleMapsLinks", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(snap.writeReviewUrl).toBe(
      "https://www.google.com/maps/place//data=!4m3!3m2!1s0xABC!12e1"
    );
  });

  it("copies placeId from id field", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(snap.placeId).toBe("ChIJhUnH0T7U1IkR6N_N0K0P67M");
  });

  it("maps name from displayName.text", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(snap.name).toBe("Joe's Pizza");
  });

  it("maps address from formattedAddress", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(snap.address).toBe("123 Main St, Brooklyn, NY 11201, USA");
  });

  it("maps primaryType", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(snap.primaryType).toBe("pizza_restaurant");
  });

  it("maps rating and userRatingCount", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(snap.rating).toBe(4.6);
    expect(snap.userRatingCount).toBe(1284);
  });

  it("maps editorialSummary text", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(snap.editorialSummary).toBe("Thin-crust slice shop.");
  });

  it("maps reviews to flattened shape", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(snap.reviews).toHaveLength(1);
    expect(snap.reviews![0]).toMatchObject({
      rating: 5,
      text: "Best pepperoni in the neighborhood.",
      relativeTime: "2 months ago",
    });
  });

  it("throws when writeAReviewUri is missing", () => {
    const bad = { ...FIXTURE, googleMapsLinks: {} };
    expect(() => normalizePlaceSnapshot(bad)).toThrow(/writeAReviewUri/i);
  });

  it("includes a fetchedAt ISO string", () => {
    const snap = normalizePlaceSnapshot(FIXTURE);
    expect(typeof snap.fetchedAt).toBe("string");
    expect(new Date(snap.fetchedAt).toISOString()).toBe(snap.fetchedAt);
  });
});
