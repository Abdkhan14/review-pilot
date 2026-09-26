import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/business-repo", () => ({ findBySlug: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { businessHandoff: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() } } }));

import * as repo from "@/lib/business-repo";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { POST } from "./route";

const mockFindBySlug = vi.mocked(repo.findBySlug);
const mockFindUnique = vi.mocked(db.businessHandoff.findUnique);
const mockCreate = vi.mocked(db.businessHandoff.create);
const mockUpdate = vi.mocked(db.businessHandoff.update);

const TODAY = new Date().toISOString().slice(0, 10);
const YESTERDAY = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);

const SAAS_BUSINESS = { id: "biz-1", slug: "test-slug-ab12", tier: "SAAS" };
const BASIC_BUSINESS = { ...SAAS_BUSINESS, tier: "BASIC" };

function makePost(slug: string) {
  const req = new NextRequest(`http://localhost/api/b/${slug}/handoff`, { method: "POST" });
  return POST(req, { params: Promise.resolve({ slug }) });
}

describe("POST /api/b/[slug]/handoff", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 404 for an unknown slug", async () => {
    mockFindBySlug.mockResolvedValue(null);
    const res = await makePost("unknown");
    expect(res.status).toBe(404);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 403 for a BASIC business", async () => {
    mockFindBySlug.mockResolvedValue(BASIC_BUSINESS as any);
    const res = await makePost("test-slug-ab12");
    expect(res.status).toBe(403);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates a row with count 1 on the first handoff", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({} as any);
    const res = await makePost("test-slug-ab12");
    expect(res.status).toBe(204);
    expect(mockCreate).toHaveBeenCalledWith({
      data: { businessId: "biz-1", count: 1, day: TODAY },
    });
  });

  it("increments count on the same day", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockFindUnique.mockResolvedValue({ businessId: "biz-1", count: 3, day: TODAY });
    mockUpdate.mockResolvedValue({} as any);
    const res = await makePost("test-slug-ab12");
    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { businessId: "biz-1" },
      data: { count: { increment: 1 } },
    });
  });

  it("does not increment when count is already at the cap (6)", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockFindUnique.mockResolvedValue({ businessId: "biz-1", count: 6, day: TODAY });
    const res = await makePost("test-slug-ab12");
    expect(res.status).toBe(204);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("resets count to 1 when the stored day is yesterday", async () => {
    mockFindBySlug.mockResolvedValue(SAAS_BUSINESS as any);
    mockFindUnique.mockResolvedValue({ businessId: "biz-1", count: 6, day: YESTERDAY });
    mockUpdate.mockResolvedValue({} as any);
    const res = await makePost("test-slug-ab12");
    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { businessId: "biz-1" },
      data: { count: 1, day: TODAY },
    });
  });
});
