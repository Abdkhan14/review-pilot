import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ verifySession: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ findById: vi.fn(), update: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));

import * as auth from "@/lib/auth";
import * as repo from "@/lib/business-repo";
import { NextRequest } from "next/server";
import { PATCH } from "./route";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

const mockVerify = vi.mocked(auth.verifySession);
const mockFindById = vi.mocked(repo.findById);
const mockUpdate = vi.mocked(repo.update);

function makePatch(id: string, body: unknown, cookie?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["cookie"] = `${ADMIN_COOKIE}=${cookie}`;
  const req = new NextRequest(`http://localhost/api/admin/businesses/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const ctx = { params: Promise.resolve({ id }) };
  return PATCH(req, ctx);
}

describe("PATCH /api/admin/businesses/[id]", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without cookie", async () => {
    const res = await makePatch("cuid-1", { tier: "BASIC" });
    expect(res.status).toBe(401);
    expect(mockFindById).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 with an invalid cookie", async () => {
    mockVerify.mockRejectedValue(new Error("bad token"));
    const res = await makePatch("cuid-1", { tier: "BASIC" }, "bad-token");
    expect(res.status).toBe(401);
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing tier", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await makePatch("cuid-1", { customInstructions: "hi" }, "valid-token");
    expect(res.status).toBe(400);
    expect(mockFindById).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid tier value", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await makePatch("cuid-1", { tier: "ENTERPRISE" }, "valid-token");
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when findById returns null", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(null);
    const res = await makePatch("unknown-id", { tier: "BASIC" }, "valid-token");
    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 200 with slug and tier; update called without slug", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue({
      id: "cuid-1",
      slug: "joes-pizza-ab12",
      name: "Joe's Pizza",
      tier: "BASIC",
      placeId: "ChIJ123",
      customInstructions: null,
      details: null,
      detailsFetchedAt: null,
      createdAt: new Date(),
    } as any);
    mockUpdate.mockResolvedValue({
      id: "cuid-1",
      slug: "joes-pizza-ab12",
      name: "Joe's Pizza",
      tier: "SAAS",
      placeId: "ChIJ123",
      customInstructions: "mention the daily special",
      details: null,
      detailsFetchedAt: null,
      createdAt: new Date(),
    } as any);

    const res = await makePatch(
      "cuid-1",
      { tier: "SAAS", customInstructions: "mention the daily special" },
      "valid-token"
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ slug: "joes-pizza-ab12", tier: "SAAS" });

    // update must never receive a slug field
    const [, , updateInput] = mockUpdate.mock.calls[0];
    expect(updateInput).not.toHaveProperty("slug");
  });

  it("slug unchanged after patch — response slug equals original slug", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const originalSlug = "original-slug-ab12";
    mockFindById.mockResolvedValue({ id: "cuid-1", slug: originalSlug } as any);
    mockUpdate.mockResolvedValue({ slug: originalSlug, tier: "SAAS" } as any);

    const res = await makePatch("cuid-1", { tier: "SAAS", slug: "hacked-slug" }, "valid-token");
    expect(res.status).toBe(200);
    expect((await res.json()).slug).toBe(originalSlug);
  });
});
