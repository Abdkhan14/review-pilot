import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { requireAdmin } from "./require-admin";

const mockSession = vi.mocked(getSessionUser);
const req = () => new NextRequest("http://localhost/api/admin/test");
const maria = { id: "u1", name: "Maria", email: "maria@joespizza.com" };

describe("requireAdmin", () => {
  beforeEach(() => mockSession.mockReset());

  it("returns 401 when signed out", async () => {
    mockSession.mockResolvedValue(null);
    expect((await requireAdmin(req()))?.status).toBe(401);
  });

  it("returns 403 for a signed-in non-admin", async () => {
    mockSession.mockResolvedValue({ ...maria, role: "user" });
    expect((await requireAdmin(req()))?.status).toBe(403);
  });

  it("returns null for an admin", async () => {
    mockSession.mockResolvedValue({ ...maria, role: "admin" });
    expect(await requireAdmin(req())).toBeNull();
  });
});
