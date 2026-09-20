import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({
  timingSafeEqual: vi.fn(),
  signSession: vi.fn(),
}));

const mockCookiesSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ set: mockCookiesSet })),
}));

import * as auth from "@/lib/auth";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

const mockTimingSafeEqual = vi.mocked(auth.timingSafeEqual);
const mockSignSession = vi.mocked(auth.signSession);

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ADMIN_PASSWORD = "correct-password";
  });

  it("returns 401 on wrong password", async () => {
    mockTimingSafeEqual.mockReturnValue(false);
    const res = await POST(makeRequest({ password: "wrong" }));
    expect(res.status).toBe(401);
    expect(mockCookiesSet).not.toHaveBeenCalled();
  });

  it("returns 401 when password is missing", async () => {
    mockTimingSafeEqual.mockReturnValue(false);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
    expect(mockCookiesSet).not.toHaveBeenCalled();
  });

  it("returns 200 and sets rp_admin cookie on correct password", async () => {
    mockTimingSafeEqual.mockReturnValue(true);
    mockSignSession.mockResolvedValue("signed-jwt-token");

    const res = await POST(makeRequest({ password: "correct-password" }));

    expect(res.status).toBe(200);
    expect(mockCookiesSet).toHaveBeenCalledWith(
      ADMIN_COOKIE,
      "signed-jwt-token",
      expect.objectContaining({ httpOnly: true })
    );
  });
});
