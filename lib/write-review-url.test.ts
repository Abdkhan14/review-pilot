import { describe, it, expect } from "vitest";
import { buildWriteReviewUrl } from "./write-review-url";

const BASE = "https://search.google.com/local/writereview";

describe("buildWriteReviewUrl", () => {
  it("returns the exact write-review URL for a standard Place ID", () => {
    expect(buildWriteReviewUrl("ChIJN1t_tDeuEmsRUsoyG83frY4")).toBe(
      `${BASE}?placeid=ChIJN1t_tDeuEmsRUsoyG83frY4`
    );
  });

  it("percent-encodes characters that need encoding", () => {
    // Place ID contains +, /, = — all must be encoded in the query value
    const url = buildWriteReviewUrl("ChIJ+abc/def=");
    expect(url).toMatch(/^https:\/\/search\.google\.com\/local\/writereview\?placeid=/);
    // The encoded Place ID portion (after "placeid=") must not contain raw + / =
    const encoded = url.split("placeid=")[1];
    expect(encoded).not.toContain("+");
    expect(encoded).not.toContain("/");
    expect(encoded).not.toContain("=");
  });

  it("does not include rating= or comment= params", () => {
    const url = buildWriteReviewUrl("ChIJ123");
    expect(url).not.toContain("rating=");
    expect(url).not.toContain("comment=");
  });

  it("throws when placeId is empty", () => {
    expect(() => buildWriteReviewUrl("")).toThrow(/placeId/i);
  });

  it("throws when placeId is whitespace only", () => {
    expect(() => buildWriteReviewUrl("   ")).toThrow(/placeId/i);
  });
});
