import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  verifySession: vi.fn(),
}));

import { verifySession } from "@/lib/auth";
import { hasAdminCookie, type CookieReader } from "./admin-cookie";

const mockVerify = vi.mocked(verifySession);

function makeCookies(token: string | undefined): CookieReader {
  return {
    get: (name: string) => (name === "rp_admin" && token ? { value: token } : undefined),
  };
}

describe("hasAdminCookie", () => {
  it("returns false when no cookie is present", async () => {
    expect(await hasAdminCookie(makeCookies(undefined))).toBe(false);
  });

  it("returns true when verifySession resolves", async () => {
    mockVerify.mockResolvedValue({ email: "admin@example.com" } as never);
    expect(await hasAdminCookie(makeCookies("valid-token"))).toBe(true);
  });

  it("returns false when verifySession throws", async () => {
    mockVerify.mockRejectedValue(new Error("invalid"));
    expect(await hasAdminCookie(makeCookies("bad-token"))).toBe(false);
  });
});
