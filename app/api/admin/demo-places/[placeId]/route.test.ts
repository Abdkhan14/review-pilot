import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/require-admin", () => ({ requireAdmin: vi.fn() }));

import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";

const mockDb = db as unknown as Record<string, unknown>;

const PLACE_ID = "abc123";
const makeReq = (body: unknown) =>
  new NextRequest(`http://localhost/api/admin/demo-places/${PLACE_ID}`, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
const makeCtx = () => ({ params: Promise.resolve({ placeId: PLACE_ID }) });

const EXISTING = {
  placeId: PLACE_ID,
  generationsUsed: 2,
  blocked: false,
  generationLimit: null,
};

describe("PATCH /api/admin/demo-places/[placeId]", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    mockDb.demoPlace = {
      findUnique: vi.fn().mockResolvedValue(EXISTING),
      update: vi.fn().mockResolvedValue({}),
    };
  });

  it("returns 401 when not admin", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 401 }),
    );
    const { PATCH } = await import("./route");
    const res = await PATCH(makeReq({ action: "reset" }), makeCtx());
    expect(res.status).toBe(401);
  });

  it("returns 404 for unknown place", async () => {
    (mockDb.demoPlace as Record<string, unknown>).findUnique = vi.fn().mockResolvedValue(null);
    const { PATCH } = await import("./route");
    const res = await PATCH(makeReq({ action: "reset" }), makeCtx());
    expect(res.status).toBe(404);
  });

  it("returns 400 for invalid body", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(makeReq({ action: "unknown" }), makeCtx());
    expect(res.status).toBe(400);
  });

  it("reset sets generationsUsed to 0", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(makeReq({ action: "reset" }), makeCtx());
    expect(res.status).toBe(204);
    expect((mockDb.demoPlace as Record<string, unknown>).update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { generationsUsed: 0 } }),
    );
  });

  it("raiseLimit sets generationLimit", async () => {
    const { PATCH } = await import("./route");
    const res = await PATCH(makeReq({ action: "raiseLimit", limit: 10 }), makeCtx());
    expect(res.status).toBe(204);
    expect((mockDb.demoPlace as Record<string, unknown>).update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { generationLimit: 10 } }),
    );
  });

  it("block and unblock toggle the flag", async () => {
    const { PATCH: PATCH1 } = await import("./route");
    await PATCH1(makeReq({ action: "block" }), makeCtx());
    expect((mockDb.demoPlace as Record<string, unknown>).update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { blocked: true } }),
    );

    vi.clearAllMocks();
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockDb.demoPlace as Record<string, unknown>).findUnique = vi.fn().mockResolvedValue({
      ...EXISTING,
      blocked: true,
    });
    (mockDb.demoPlace as Record<string, unknown>).update = vi.fn().mockResolvedValue({});
    const { PATCH: PATCH2 } = await import("./route");
    await PATCH2(makeReq({ action: "unblock" }), makeCtx());
    expect((mockDb.demoPlace as Record<string, unknown>).update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { blocked: false } }),
    );
  });
});
