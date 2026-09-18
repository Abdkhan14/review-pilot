import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/auth", () => ({ verifySession: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ create: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: {} }));

import * as auth from "@/lib/auth";
import * as repo from "@/lib/business-repo";
import { NextRequest } from "next/server";
import { POST } from "./route";
import { ADMIN_COOKIE } from "@/lib/session-cookie";

const mockVerify = vi.mocked(auth.verifySession);
const mockCreate = vi.mocked(repo.create);

function postBody(body: unknown, cookie?: string): Promise<Response> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (cookie) headers["cookie"] = `${ADMIN_COOKIE}=${cookie}`;
  const req = new NextRequest("http://localhost/api/admin/businesses", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  return POST(req);
}

describe("POST /api/admin/businesses", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 without cookie", async () => {
    const res = await postBody({ name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" });
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 401 with an invalid cookie", async () => {
    mockVerify.mockRejectedValue(new Error("bad token"));
    const res = await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC" },
      "bad-token"
    );
    expect(res.status).toBe(401);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing name", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await postBody({ placeId: "ChIJ123", tier: "BASIC" }, "valid-token");
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing placeId", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await postBody({ name: "Joe's Pizza", tier: "BASIC" }, "valid-token");
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 400 on missing tier", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    const res = await postBody({ name: "Joe's Pizza", placeId: "ChIJ123" }, "valid-token");
    expect(res.status).toBe(400);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns 201, calls create without slug, returns the server slug", async () => {
    mockVerify.mockResolvedValue({ role: "admin" });
    mockCreate.mockResolvedValue({ slug: "joes-pizza-ab12" } as any);

    const res = await postBody(
      { name: "Joe's Pizza", placeId: "ChIJ123", tier: "BASIC", slug: "client-slug" },
      "valid-token"
    );

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ slug: "joes-pizza-ab12" });

    const [, callInput] = mockCreate.mock.calls[0];
    expect(callInput).not.toHaveProperty("slug");
  });
});
