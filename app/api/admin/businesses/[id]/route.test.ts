import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ findById: vi.fn(), update: vi.fn(), remove: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));

import { getSessionUser } from "@/lib/session";
import * as repo from "@/lib/business-repo";
import { NextRequest } from "next/server";
import { PATCH, DELETE } from "./route";

const mockSession = vi.mocked(getSessionUser);
const ADMIN = { id: "u1", name: "Admin", email: "admin@example.com", role: "admin" };
const USER = { id: "u2", name: "Maria", email: "maria@joespizza.com", role: "user" };
const mockFindById = vi.mocked(repo.findById);
const mockUpdate = vi.mocked(repo.update);
const mockRemove = vi.mocked(repo.remove);

function makeDelete(id: string): Promise<Response> {
  const req = new NextRequest(`http://localhost/api/admin/businesses/${id}`, {
    method: "DELETE",
  });
  const ctx = { params: Promise.resolve({ id }) };
  return DELETE(req, ctx);
}

function makePatch(id: string, body: unknown): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const req = new NextRequest(`http://localhost/api/admin/businesses/${id}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(body),
  });
  const ctx = { params: Promise.resolve({ id }) };
  return PATCH(req, ctx);
}

describe("PATCH /api/admin/businesses/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(null);
  });

  it("returns 401 when signed out", async () => {
    const res = await makePatch("cuid-1", { tier: "BASIC" });
    expect(res.status).toBe(401);
    expect(mockFindById).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-in non-admin", async () => {
    mockSession.mockResolvedValue(USER);
    const res = await makePatch("cuid-1", { tier: "BASIC" });
    expect(res.status).toBe(403);
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing tier", async () => {
    mockSession.mockResolvedValue(ADMIN);
    const res = await makePatch("cuid-1", { customInstructions: "hi" });
    expect(res.status).toBe(400);
    expect(mockFindById).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 for an invalid tier value", async () => {
    mockSession.mockResolvedValue(ADMIN);
    const res = await makePatch("cuid-1", { tier: "ENTERPRISE" });
    expect(res.status).toBe(400);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when findById returns null", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFindById.mockResolvedValue(null);
    const res = await makePatch("unknown-id", { tier: "BASIC" });
    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 200 with slug and tier; update called without slug", async () => {
    mockSession.mockResolvedValue(ADMIN);
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
      { tier: "SAAS", customInstructions: "mention the daily special" }
    );

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toMatchObject({ slug: "joes-pizza-ab12", tier: "SAAS" });

    // update must never receive a slug field
    const [, , updateInput] = mockUpdate.mock.calls[0];
    expect(updateInput).not.toHaveProperty("slug");
  });

  it("slug unchanged after patch — response slug equals original slug", async () => {
    mockSession.mockResolvedValue(ADMIN);
    const originalSlug = "original-slug-ab12";
    mockFindById.mockResolvedValue({ id: "cuid-1", slug: originalSlug } as any);
    mockUpdate.mockResolvedValue({ slug: originalSlug, tier: "SAAS" } as any);

    const res = await makePatch("cuid-1", { tier: "SAAS", slug: "hacked-slug" });
    expect(res.status).toBe(200);
    expect((await res.json()).slug).toBe(originalSlug);
  });
});

describe("DELETE /api/admin/businesses/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(null);
  });

  it("returns 401 when signed out", async () => {
    const res = await makeDelete("cuid-1");
    expect(res.status).toBe(401);
    expect(mockFindById).not.toHaveBeenCalled();
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-in non-admin", async () => {
    mockSession.mockResolvedValue(USER);
    const res = await makeDelete("cuid-1");
    expect(res.status).toBe(403);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("returns 404 when findById returns null", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFindById.mockResolvedValue(null);
    const res = await makeDelete("unknown-id");
    expect(res.status).toBe(404);
    expect(mockRemove).not.toHaveBeenCalled();
  });

  it("returns 204 and calls remove with the id", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFindById.mockResolvedValue({ id: "cuid-1" } as any);
    mockRemove.mockResolvedValue({ id: "cuid-1" } as any);

    const res = await makeDelete("cuid-1");
    expect(res.status).toBe(204);
    expect(mockRemove).toHaveBeenCalledWith(expect.anything(), "cuid-1");
  });
});
