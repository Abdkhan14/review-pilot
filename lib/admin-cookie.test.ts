import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  verifySession: vi.fn(),
}));

import { verifySession } from "@/lib/auth";
import { hasAdminCookie } from "./admin-cookie";
import type { NextRequest } from "next/server";

const mockVerify = vi.mocked(verifySession);

function makeReq(token: string | undefined): NextRequest {
  return {
    cookies: { get: (name: string) => (name === "rp_admin" && token ? { value: token } : undefined) },
  } as unknown as NextRequest;
}

describe("hasAdminCookie", () => {
  it("returns false when no cookie is present", async () => {
    expect(await hasAdminCookie(makeReq(undefined))).toBe(false);
  });

  it("returns true when verifySession resolves", async () => {
    mockVerify.mockResolvedValue({ email: "admin@example.com" } as never);
    expect(await hasAdminCookie(makeReq("valid-token"))).toBe(true);
  });

  it("returns false when verifySession throws", async () => {
    mockVerify.mockRejectedValue(new Error("invalid"));
    expect(await hasAdminCookie(makeReq("bad-token"))).toBe(false);
  });
});
