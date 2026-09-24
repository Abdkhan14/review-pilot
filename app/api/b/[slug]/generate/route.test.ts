import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/business-repo", () => ({ findBySlug: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/generate-drafts", () => ({
  generateDrafts: vi.fn(),
  GenerationError: class GenerationError extends Error {},
}));
vi.mock("@/lib/prompt-builder", () => ({
  buildPrompt: vi.fn(() => []),
  anglesForPrimaryType: vi.fn(() => [
    { label: "food angle", pick: "a main" },
    { label: "service angle", pick: "a main" },
    { label: "vibe angle", pick: "a main" },
  ]),
}));
vi.mock("@/lib/review-recipe", () => ({
  sampleRecipeTrio: vi.fn(() => [
    { length: "short", voice: "specific", opener: "i_first", item: "must", proseFact: "forbid", texture: "clean" },
    { length: "medium", voice: "hedged", opener: "i_first", item: "optional", proseFact: "forbid", texture: "clean" },
    { length: "short", voice: "clipped", opener: "i_first", item: "skip", proseFact: "allow", texture: "clean" },
  ]),
}));
vi.mock("@/lib/review-texture", () => ({ applyTexture: vi.fn((text: string) => text) }));

import * as repo from "@/lib/business-repo";
import * as generateDraftsLib from "@/lib/generate-drafts";
import * as promptBuilderLib from "@/lib/prompt-builder";
import { resetRateLimitStore } from "@/lib/rate-limit";
import { NextRequest } from "next/server";
import { POST } from "./route";

const mockFindBySlug = vi.mocked(repo.findBySlug);
const mockGenerateDrafts = vi.mocked(generateDraftsLib.generateDrafts);
const mockBuildPrompt = vi.mocked(promptBuilderLib.buildPrompt);

const SNAPSHOT = {
  placeId: "ChIJ123",
  name: "Joe's Pizza",
  address: "123 Main St",
  primaryType: "pizza_restaurant",
  rating: 4.6,
  userRatingCount: 100,
  writeReviewUrl: "https://search.google.com/local/writereview?placeid=ChIJ123",
  reviews: [{ rating: 5, text: "Great!", relativeTime: "1 month ago" }],
  fetchedAt: "2026-09-20T00:00:00.000Z",
};

const SAAS_BUSINESS = {
  id: "cuid1",
  slug: "joes-pizza-ab12",
  name: "Joe's Pizza",
  tier: "SAAS",
  placeId: "ChIJ123",
  customInstructions: null,
  writeReviewUrl: SNAPSHOT.writeReviewUrl,
  details: JSON.stringify(SNAPSHOT),
  detailsFetchedAt: new Date("2026-09-20T00:00:00.000Z"),
  createdAt: new Date(),
};

const BASIC_BUSINESS = { ...SAAS_BUSINESS, tier: "BASIC" };

const THREE_DRAFTS = [
  { id: "a", angle: "food angle", text: "Great pizza!" },
  { id: "b", angle: "service angle", text: "Friendly staff." },
  { id: "c", angle: "vibe angle", text: "Lovely atmosphere." },
];

function makePost(slug: string): Promise<Response> {
  const req = new NextRequest(`http://localhost/api/b/${slug}/generate`, { method: "POST" });
  return POST(req, { params: Promise.resolve({ slug }) });
}

describe("POST /api/b/[slug]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
  });

  it("returns 404 for an unknown slug", async () => {
    mockFindBySlug.mockResolvedValue(null);
    const res = await makePost("unknown-slug");
    expect(res.status).toBe(404);
    expect(mockGenerateDrafts).not.toHaveBeenCalled();
  });

  it("returns 403 for a BASIC tier business and does not call generateDrafts", async () => {
    mockFindBySlug.mockResolvedValue(BASIC_BUSINESS as any);
    const res = await makePost("joes-pizza-ab12");
    expect(res.status).toBe(403);
    expect(mockGenerateDrafts).not.toHaveBeenCalled();
  });

  it("returns 200 with reviews and writeReviewUrl for a SAAS business", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    const res = await makePost("joes-pizza-ab12");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reviews).toHaveLength(3);
    expect(body.reviews[0]).toMatchObject({ id: "a", angle: "food angle" });
    expect(body.writeReviewUrl).toBe(SNAPSHOT.writeReviewUrl);
  });

  it("calls buildPrompt 3 times — one per draft slot", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");
    expect(mockBuildPrompt).toHaveBeenCalledTimes(3);
  });

  it("passes draft ids a, b, c to the three buildPrompt calls", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");
    const ids = mockBuildPrompt.mock.calls.map((c) => c[0].id);
    expect(ids).toEqual(["a", "b", "c"]);
  });

  it("returns 500 when GenerationError is thrown and does not leak model output", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    const { GenerationError } = await import("@/lib/generate-drafts");
    mockGenerateDrafts.mockRejectedValue(
      new GenerationError("model returned non-JSON content"),
    );
    const res = await makePost("joes-pizza-ab12");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body).toHaveProperty("error");
    expect(body.error).not.toContain("model returned non-JSON content");
  });

  it("passes an assigned item from catalog to buildPrompt (non-skip slots) when notes have list items", async () => {
    const businessWithNotes = {
      ...SAAS_BUSINESS,
      customInstructions: "# Mains\n- Shawarma\n- Mixed Grill\n\n# Sides\n- Hummus\n- Falafel\n\n# Drinks\n- Mint Tea",
    };
    mockFindBySlug.mockResolvedValue(businessWithNotes as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");

    const validItems = new Set(["Shawarma", "Mixed Grill", "Hummus", "Falafel", "Mint Tea"]);

    // Calls at index 0 (item: "must") and index 1 (item: "optional") should have assignedItem.
    const call0 = mockBuildPrompt.mock.calls[0][0];
    const call1 = mockBuildPrompt.mock.calls[1][0];
    expect(validItems.has(call0.assignedItem!)).toBe(true);
    expect(validItems.has(call1.assignedItem!)).toBe(true);
  });

  it("passes no assignedItem to the skip-policy draft slot", async () => {
    const businessWithNotes = {
      ...SAAS_BUSINESS,
      customInstructions: "# Mains\n- Shawarma\n- Mixed Grill\n\n# Sides\n- Hummus",
    };
    mockFindBySlug.mockResolvedValue(businessWithNotes as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");

    // Call at index 2 has recipe.item = "skip" → assignedItem must be undefined.
    const call2 = mockBuildPrompt.mock.calls[2][0];
    expect(call2.assignedItem).toBeUndefined();
  });

  it("does not pass the full item catalog to buildPrompt — only prose", async () => {
    const businessWithNotes = {
      ...SAAS_BUSINESS,
      customInstructions: "Don't mention wait times.\n\n# Mains\n- Shawarma\n- Mixed Grill\n\n# Sides\n- Hummus",
    };
    mockFindBySlug.mockResolvedValue(businessWithNotes as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");

    for (const [call] of mockBuildPrompt.mock.calls) {
      expect(call.customInstructions).toContain("Don't mention wait times.");
      expect(call.customInstructions).not.toContain("Shawarma");
      expect(call.customInstructions).not.toContain("Hummus");
    }
  });

  it("passes no assignedItem to any buildPrompt call when notes have no list items", async () => {
    const businessWithProseOnly = {
      ...SAAS_BUSINESS,
      customInstructions: "Always mention the open kitchen.",
    };
    mockFindBySlug.mockResolvedValue(businessWithProseOnly as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");

    for (const [call] of mockBuildPrompt.mock.calls) {
      expect(call.assignedItem).toBeUndefined();
      expect(call.customInstructions).toBe("Always mention the open kitchen.");
    }
  });

  it("returns 429 on the 6th request in the window and does not call generateDrafts", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    for (let i = 0; i < 5; i++) {
      const res = await makePost("joes-pizza-ab12");
      expect(res.status).toBe(200);
    }
    const res = await makePost("joes-pizza-ab12");
    expect(res.status).toBe(429);
    expect(mockGenerateDrafts).toHaveBeenCalledTimes(5);
  });
});
