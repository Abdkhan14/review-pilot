import { vi, describe, it, expect } from "vitest";

vi.mock("server-only", () => ({}));

const mockCookiesSet = vi.fn();
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({ set: mockCookiesSet })),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

function makeRequest(): NextRequest {
  return new NextRequest("http://localhost/api/auth/logout", {
    method: "POST",
  });
}

describe("POST /api/auth/logout", () => {
  it("returns 200 and expires the rp_admin cookie", async () => {
    const res = await POST(makeRequest());

    expect(res.status).toBe(200);
    expect(mockCookiesSet).toHaveBeenCalledWith(
      ADMIN_COOKIE,
      "",
      expect.objectContaining({ maxAge: 0 })
    );
  });
});
