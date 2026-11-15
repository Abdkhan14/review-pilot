import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/require-admin", () => ({ requireAdmin: vi.fn() }));
vi.mock("@/lib/demo-repo", () => ({ listDemoPlaces: vi.fn() }));
vi.mock("@/lib/settings", () => ({ getLimits: vi.fn() }));
vi.mock("@/lib/usage", () => ({ siteGenerationsToday: vi.fn() }));

import { requireAdmin } from "@/lib/require-admin";
import { listDemoPlaces } from "@/lib/demo-repo";
import { getLimits } from "@/lib/settings";
import { siteGenerationsToday } from "@/lib/usage";
import { db } from "@/lib/db";

const mockDb = db as unknown as Record<string, unknown>;

const makeReq = () => new NextRequest("http://localhost/api/admin/demo-places");

describe("GET /api/admin/demo-places", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (siteGenerationsToday as ReturnType<typeof vi.fn>).mockResolvedValue(10);
    (getLimits as ReturnType<typeof vi.fn>).mockResolvedValue({
      "demo.dailyGenerations": 200,
      "demo.generationsPerPlace": 5,
      "demo.createsPerIpPerDay": 5,
    });
    (listDemoPlaces as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    mockDb.demoSession = { count: vi.fn().mockResolvedValue(3) };
  });

  it("returns 401 when not admin", async () => {
    (requireAdmin as ReturnType<typeof vi.fn>).mockResolvedValue(
      new Response(null, { status: 401 }),
    );
    const { GET } = await import("./route");
    const res = await GET(makeReq());
    expect(res.status).toBe(401);
  });

  it("returns stats and places", async () => {
    (listDemoPlaces as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        placeId: "place1",
        name: "Joe's Pizza",
        generationsUsed: 2,
        generationLimit: null,
        blocked: false,
        todayCount: 1,
        sessionCount: 2,
      },
    ]);
    const { GET } = await import("./route");
    const res = await GET(makeReq());
    const body = await res.json();
    expect(body.stats.generationsToday).toBe(10);
    expect(body.stats.dailyBudget).toBe(200);
    expect(body.stats.linksToday).toBe(3);
    expect(body.places[0].name).toBe("Joe's Pizza");
    expect(body.places[0].generationLimit).toBe(5);
  });
});
