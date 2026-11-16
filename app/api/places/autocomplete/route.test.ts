import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/flags", () => ({ isNewLandingEnabled: vi.fn() }));
vi.mock("@/lib/places-autocomplete", () => ({ searchPlaces: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  ipFromHeaders: vi.fn().mockReturnValue("127.0.0.1"),
  rateLimitKey: vi.fn().mockReturnValue("127.0.0.1:places"),
  checkRateLimit: vi.fn().mockReturnValue(true),
}));

import { NextRequest } from "next/server";
import { POST } from "./route";
import * as flags from "@/lib/flags";
import * as autocomplete from "@/lib/places-autocomplete";
import * as rateLimit from "@/lib/rate-limit";

const mockFlag = vi.mocked(flags.isNewLandingEnabled);
const mockSearch = vi.mocked(autocomplete.searchPlaces);
const mockCheck = vi.mocked(rateLimit.checkRateLimit);

function makePost(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/places/autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mockFlag.mockResolvedValue(true);
  mockSearch.mockResolvedValue([]);
  mockCheck.mockReturnValue(true);
});

describe("POST /api/places/autocomplete", () => {
  it("returns 404 when flag is off", async () => {
    mockFlag.mockResolvedValue(false);
    const res = await POST(makePost({ input: "Joe", sessionToken: "00000000-0000-0000-0000-000000000000" }));
    expect(res.status).toBe(404);
  });

  it("returns 429 when rate limited", async () => {
    mockCheck.mockReturnValue(false);
    const res = await POST(makePost({ input: "Joe", sessionToken: "00000000-0000-0000-0000-000000000000" }));
    expect(res.status).toBe(429);
  });

  it("returns 400 for invalid body — input too short", async () => {
    const res = await POST(makePost({ input: "J", sessionToken: "00000000-0000-0000-0000-000000000000" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid body — bad sessionToken", async () => {
    const res = await POST(makePost({ input: "Joe's Pizza", sessionToken: "not-a-uuid" }));
    expect(res.status).toBe(400);
  });

  it("returns places on success", async () => {
    const place = { placeId: "abc", name: "Joe's", address: "123 Main" };
    mockSearch.mockResolvedValue([place]);

    const res = await POST(makePost({ input: "Joe", sessionToken: "00000000-0000-0000-0000-000000000000" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ places: [place] });
  });

  it("returns 502 when Google call fails", async () => {
    mockSearch.mockRejectedValue(new Error("upstream error"));
    const res = await POST(makePost({ input: "Joe", sessionToken: "00000000-0000-0000-0000-000000000000" }));
    expect(res.status).toBe(502);
  });
});
