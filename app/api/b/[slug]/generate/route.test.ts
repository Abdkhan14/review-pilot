import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/business-repo", () => ({ findBySlug: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/generate-drafts", () => ({ generateDrafts: vi.fn(), GenerationError: class GenerationError extends Error {} }));

import * as repo from "@/lib/business-repo";
import * as generateDraftsLib from "@/lib/generate-drafts";
import { NextRequest } from "next/server";
import { POST } from "./route";

const mockFindBySlug = vi.mocked(repo.findBySlug);
const mockGenerateDrafts = vi.mocked(generateDraftsLib.generateDrafts);

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

function makePost(slug: string): Promise<Response> {
  const req = new NextRequest(`http://localhost/api/b/${slug}/generate`, {
    method: "POST",
  });
  return POST(req, { params: Promise.resolve({ slug }) });
}

describe("POST /api/b/[slug]/generate", () => {
  beforeEach(() => vi.clearAllMocks());

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
});
