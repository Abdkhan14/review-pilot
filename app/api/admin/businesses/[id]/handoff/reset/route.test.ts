import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ verifySession: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ findById: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    businessHandoff: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import * as auth from "@/lib/auth";
import * as repo from "@/lib/business-repo";
import { db } from "@/lib/db";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

const mockVerify = vi.mocked(auth.verifySession);
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

function makePost(id: string, cookie?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (cookie) headers["cookie"] = `${ADMIN_COOKIE}=${cookie}`;
  const req = new NextRequest(
    `http://localhost/api/admin/businesses/${id}/handoff/reset`,
    { method: "POST", headers },
  );
  return POST(req, { params: Promise.resolve({ id }) });
}

describe("POST /api/admin/businesses/[id]/handoff/reset", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without an admin cookie", async () => {
    const res = await makePost("biz-1");
    expect(res.status).toBe(401);
    expect(mockFindById).not.toHaveBeenCalled();
  });

  it("returns 401 with an invalid cookie", async () => {
    mockVerify.mockRejectedValue(new Error("bad token"));
    const res = await makePost("biz-1", "bad-token");
    expect(res.status).toBe(401);
  });

  it("returns 404 for an unknown business id", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(null);
    const res = await makePost("unknown", "valid-token");
    expect(res.status).toBe(404);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("returns 204 without writing when no handoff row exists", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(BUSINESS as any);
    mockFindUnique.mockResolvedValue(null);
    const res = await makePost("biz-1", "valid-token");
    expect(res.status).toBe(204);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("sets count to 0 and day to today for an existing row", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockFindById.mockResolvedValue(BUSINESS as any);
    mockFindUnique.mockResolvedValue({ businessId: "biz-1", count: 5, day: TODAY });
    mockUpdate.mockResolvedValue({} as any);
    const res = await makePost("biz-1", "valid-token");
    expect(res.status).toBe(204);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { businessId: "biz-1" },
      data: { count: 0, day: TODAY },
    });
  });
});
