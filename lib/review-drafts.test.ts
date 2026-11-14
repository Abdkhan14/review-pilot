import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/generate-drafts", () => ({
  generateDrafts: vi.fn(),
  GenerationError: class GenerationError extends Error {},
  DRAFT_COUNT: 3,
}));
vi.mock("@/lib/review-texture", () => ({
  applyTexture: (_text: string) => _text,
  applyTypo: (_text: string) => _text,
}));
vi.mock("@/lib/review-polish", () => ({
  polishDraft: (text: string) => text,
}));

import { generateDrafts } from "@/lib/generate-drafts";
import { pickCatalogItems, buildSlots, writeReviewDrafts } from "./review-drafts";
import type { PlaceSnapshot } from "./place-snapshot";

const mockGenerateDrafts = vi.mocked(generateDrafts);

const SNAPSHOT: PlaceSnapshot = {
  placeId: "abc123",
  name: "Joe's Pizza",
  address: "123 Main St",
  writeReviewUrl: "https://search.google.com/local/writereview?placeid=abc123",
  fetchedAt: new Date().toISOString(),
};

const STUB_DRAFTS = [
  { id: "a", text: "Great pizza!" },
  { id: "b", text: "Loved the crust." },
  { id: "c", text: "Will be back." },
];

beforeEach(() => {
  mockGenerateDrafts.mockReset();
});

describe("pickCatalogItems", () => {
  it("returns empty arrays when rawNotes is undefined", () => {
    const result = pickCatalogItems(undefined);
    expect(result.itemNames).toEqual([]);
    expect(result.promptNotes).toBeUndefined();
  });

  it("returns rawNotes as promptNotes when no catalog items are found", () => {
    const result = pickCatalogItems("Just some prose with no items.");
    expect(result.promptNotes).toBe("Just some prose with no items.");
    expect(result.itemNames).toEqual([]);
  });
});

describe("buildSlots", () => {
  it("returns three slots for three DRAFT_IDS", () => {
    const { slots } = buildSlots(SNAPSHOT, [], undefined);
    expect(slots).toHaveLength(3);
  });

  it("returns three recipes alongside the slots", () => {
    const { recipes } = buildSlots(SNAPSHOT, [], undefined);
    expect(recipes).toHaveLength(3);
  });
});

describe("writeReviewDrafts", () => {
  it("calls generateDrafts and returns the drafts", async () => {
    mockGenerateDrafts.mockResolvedValue(STUB_DRAFTS);
    const reviews = await writeReviewDrafts(SNAPSHOT, undefined);
    expect(mockGenerateDrafts).toHaveBeenCalledOnce();
    expect(reviews).toHaveLength(3);
    expect(reviews[0].text).toBe("Great pizza!");
  });

  it("propagates GenerationError from generateDrafts", async () => {
    const { GenerationError } = await import("@/lib/generate-drafts");
    mockGenerateDrafts.mockRejectedValue(new GenerationError("boom"));
    await expect(writeReviewDrafts(SNAPSHOT, undefined)).rejects.toBeInstanceOf(
      GenerationError,
    );
  });
});
