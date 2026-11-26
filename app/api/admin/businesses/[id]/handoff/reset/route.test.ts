import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ findById: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    businessHandoff: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { getSessionUser } from "@/lib/session";
import * as repo from "@/lib/business-repo";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { POST } from "./route";

const mockSession = vi.mocked(getSessionUser);
const ADMIN = { id: "u1", name: "Admin", email: "admin@example.com", role: "admin" };
const USER = { id: "u2", name: "Maria", email: "maria@joespizza.com", role: "user" };
const mockFindById = vi.mocked(repo.findById);
const mockFindUnique = vi.mocked(db.businessHandoff.findUnique);
const mockUpdate = vi.mocked(db.businessHandoff.update);

const TODAY = new Date().toISOString().slice(0, 10);

const BUSINESS = {
  id: "biz-1",
  slug: "joes-pizza-ab12",
  name: "Joe's Pizza",
  tier: "SAAS",
  placeId: "ChIJ123",
  customInstructions: null,
  details: null,
  detailsFetchedAt: null,
  createdAt: new Date(),
};

function makePost(id: string): Promise<Response> {
  const req = new NextRequest(
    `http://localhost/api/admin/businesses/${id}/handoff/reset`,
    { method: "POST" },
  );
  return POST(req, { params: Promise.resolve({ id }) });
}

describe("POST /api/admin/businesses/[id]/handoff/reset", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(null);
  });

  it("returns 401 when signed out", async () => {
    const res = await makePost("biz-1");
    expect(res.status).toBe(401);
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it("returns 403 for a signed-in non-admin", async () => {
    mockSession.mockResolvedValue(USER);
    const res = await makePost("biz-1");
    expect(res.status).toBe(403);
  });

  it("returns 404 for an unknown business id", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFindById.mockResolvedValue(null);
    const res = await makePost("unknown");
    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 204 without writing when no handoff row exists", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFindById.mockResolvedValue(BUSINESS as any);
    mockFindUnique.mockResolvedValue(null);
    const res = await makePost("biz-1");
    expect(res.status).toBe(204);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("sets count to 0 and day to today for an existing row", async () => {
    mockSession.mockResolvedValue(ADMIN);
    mockFindById.mockResolvedValue(BUSINESS as any);
    mockFindUnique.mockResolvedValue({ businessId: "biz-1", count: 5, day: TODAY });
    mockUpdate.mockResolvedValue({} as any);
    const res = await makePost("biz-1");
    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { businessId: "biz-1" },
      data: { count: 0, day: TODAY },
    });
  });
});
