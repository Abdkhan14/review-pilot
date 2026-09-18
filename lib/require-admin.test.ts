import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ verifySession: vi.fn() }));

import * as auth from "@/lib/auth";
import { NextRequest } from "next/server";
import { requireAdmin } from "./require-admin";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

const mockVerify = vi.mocked(auth.verifySession);

function makeRequest(cookie?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (cookie) headers["cookie"] = `${ADMIN_COOKIE}=${cookie}`;
  return new NextRequest("http://localhost/api/admin/test", { headers });
}

describe("requireAdmin", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when no cookie is present", async () => {
    const res = await requireAdmin(makeRequest());
    expect(res?.status).toBe(401);
  });

  it("returns 401 when the cookie is invalid", async () => {
    mockVerify.mockRejectedValue(new Error("bad token"));
    const res = await requireAdmin(makeRequest("bad-token"));
    expect(res?.status).toBe(401);
  });

  it("returns null when the cookie is valid", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await requireAdmin(makeRequest("valid-token"));
    expect(res).toBeNull();
  });
});
