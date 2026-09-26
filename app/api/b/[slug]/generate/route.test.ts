import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/business-repo", () => ({ findBySlug: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    businessHandoff: { findUnique: vi.fn() },
  },
}));
vi.mock("@/lib/generate-drafts", () => ({ generateDrafts: vi.fn(), GenerationError: class GenerationError extends Error {} }));
vi.mock("@/lib/prompt-builder", () => ({ buildPrompt: vi.fn(() => []) }));

import * as repo from "@/lib/business-repo";
import * as generateDraftsLib from "@/lib/generate-drafts";
import * as promptBuilderLib from "@/lib/prompt-builder";
import { db } from "@/lib/db";
import { resetRateLimitStore } from "@/lib/rate-limit";
import { NextRequest } from "next/server";
import { POST } from "./route";

const mockBuildPrompt = vi.mocked(promptBuilderLib.buildPrompt);

const mockFindBySlug = vi.mocked(repo.findBySlug);
const mockGenerateDrafts = vi.mocked(generateDraftsLib.generateDrafts);
const mockHandoffFindUnique = vi.mocked(db.businessHandoff.findUnique);

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
  { id: "a", angle: "food", text: "Great pizza!" },
  { id: "b", angle: "service", text: "Friendly staff." },
  { id: "c", angle: "vibe", text: "Lovely atmosphere." },
];

function makePost(slug: string, { testing = false }: { testing?: boolean } = {}): Promise<Response> {
  const url = testing
    ? `http://localhost/api/b/${slug}/generate?testing=true`
    : `http://localhost/api/b/${slug}/generate`;
  const req = new NextRequest(url, { method: "POST" });
  return POST(req, { params: Promise.resolve({ slug }) });
}

describe("POST /api/b/[slug]/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitStore();
    // Default: no handoff row (not capped)
    mockHandoffFindUnique.mockResolvedValue(null);
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
    expect(body.reviews[0]).toMatchObject({ id: "a", angle: "food" });
    expect(body.writeReviewUrl).toBe(SNAPSHOT.writeReviewUrl);
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

  it("passes assigned items from catalog to buildPrompt when notes have list items", async () => {
    const businessWithNotes = {
      ...SAAS_BUSINESS,
      customInstructions: "# Mains\n- Shawarma\n- Mixed Grill\n\n# Sides\n- Hummus\n- Falafel\n\n# Drinks\n- Mint Tea",
    };
    mockFindBySlug.mockResolvedValue(businessWithNotes as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");

    const call = mockBuildPrompt.mock.calls[0][0];
    expect(call.assignedItems).toHaveLength(3);
    const validItems = new Set(["Shawarma", "Mixed Grill", "Hummus", "Falafel", "Mint Tea"]);
    for (const item of call.assignedItems!) {
      expect(validItems.has(item.name)).toBe(true);
    }
  });

  it("does not pass the full item catalog to buildPrompt — only prose", async () => {
    const businessWithNotes = {
      ...SAAS_BUSINESS,
      customInstructions: "Don't mention wait times.\n\n# Mains\n- Shawarma\n- Mixed Grill\n\n# Sides\n- Hummus",
    };
    mockFindBySlug.mockResolvedValue(businessWithNotes as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");

    const call = mockBuildPrompt.mock.calls[0][0];
    // Prose override guidance must be present.
    expect(call.customInstructions).toContain("Don't mention wait times.");
    // The raw item list must not be forwarded to the model.
    expect(call.customInstructions).not.toContain("Shawarma");
    expect(call.customInstructions).not.toContain("Hummus");
  });

  it("passes no assignedItems to buildPrompt when notes have no list items", async () => {
    const businessWithProseOnly = {
      ...SAAS_BUSINESS,
      customInstructions: "Always mention the open kitchen.",
    };
    mockFindBySlug.mockResolvedValue(businessWithProseOnly as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    await makePost("joes-pizza-ab12");

    const call = mockBuildPrompt.mock.calls[0][0];
    expect(call.assignedItems).toBeUndefined();
    // Prose-only notes are passed through unchanged.
    expect(call.customInstructions).toBe("Always mention the open kitchen.");
  });

  it("returns 429 on the 6th request in the window and does not call generateDrafts", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    // Exhaust the limit (5 allowed)
    for (let i = 0; i < 5; i++) {
      const res = await makePost("joes-pizza-ab12");
      expect(res.status).toBe(200);
    }
    // 6th is rate limited
    const res = await makePost("joes-pizza-ab12");
    expect(res.status).toBe(429);
    expect(mockGenerateDrafts).toHaveBeenCalledTimes(5);
  });

  it("returns 409 daily_cap when the business has reached the daily handoff limit", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    const today = new Date().toISOString().slice(0, 10);
    mockHandoffFindUnique.mockResolvedValue({ businessId: SAAS_BUSINESS.id, count: 6, day: today });
    const res = await makePost("joes-pizza-ab12");
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toBe("daily_cap");
    expect(body.retryAt).toBeTypeOf("number");
    expect(mockGenerateDrafts).not.toHaveBeenCalled();
  });

  it("returns 200 when capped but ?testing=true is set — skips cap check entirely", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockGenerateDrafts.mockResolvedValue(THREE_DRAFTS);
    // handoffFindUnique should NOT be called in testing mode
    const today = new Date().toISOString().slice(0, 10);
    mockHandoffFindUnique.mockResolvedValue({ businessId: SAAS_BUSINESS.id, count: 6, day: today });
    const res = await makePost("joes-pizza-ab12", { testing: true });
    expect(res.status).toBe(200);
    expect(mockHandoffFindUnique).not.toHaveBeenCalled();
    expect(mockGenerateDrafts).toHaveBeenCalledTimes(1);
  });
});
