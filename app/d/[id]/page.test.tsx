/// @vitest-environment jsdom
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/navigation", () => ({ notFound: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }), redirect: vi.fn((url: string) => { throw new Error(`NEXT_REDIRECT:${url}`); }) }));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/flags", () => ({ isNewLandingEnabled: vi.fn() }));
vi.mock("@/lib/settings", () => ({ getLimits: vi.fn() }));
vi.mock("@/lib/demo-repo", () => ({ findSession: vi.fn() }));
vi.mock("@/components/demo/DemoScan", () => ({ DemoScan: () => <div data-testid="demo-scan" /> }));
vi.mock("@/components/demo/ExpiredDemo", () => ({ ExpiredDemo: ({ shopName }: { shopName: string }) => <div data-testid="expired-demo">{shopName}</div> }));
vi.mock("@/components/demo/UsedUpDemo", () => ({ UsedUpDemo: ({ shopName }: { shopName: string }) => <div data-testid="used-up-demo">{shopName}</div> }));

import * as nextHeaders from "next/headers";
import * as flags from "@/lib/flags";
import * as settings from "@/lib/settings";
import * as demoRepo from "@/lib/demo-repo";
import { render, screen, cleanup } from "@testing-library/react";
import DemoPage from "./page";

const mockHeaders = vi.mocked(nextHeaders.headers);
const mockFlag = vi.mocked(flags.isNewLandingEnabled);
const mockLimits = vi.mocked(settings.getLimits);
const mockFindSession = vi.mocked(demoRepo.findSession);

const LIMITS = {
  "assisted.dailyHandoffLimit": 6,
  "trial.generationLimit": 5,
  "trial.handoffLimit": 2,
  "demo.generationsPerPlace": 5,
  "demo.createsPerIpPerDay": 5,
  "demo.dailyGenerations": 200,
};

const PLACE = {
  placeId: "ChIJabc",
  name: "Joe's Pizza",
  writeReviewUrl: "https://g.co/write",
  details: null,
  detailsFetchedAt: null,
  generationsUsed: 0,
  generationLimit: null,
  blocked: false,
  createdAt: new Date(),
};

const SESSION = {
  id: "sess1",
  placeId: "ChIJabc",
  place: PLACE,
  ipHash: "hash",
  customInstructions: null,
  generations: 0,
  createdAt: new Date(),
  expiresAt: new Date(Date.now() + 86_400_000),
};

function makeParams(id = "sess1", plan?: string) {
  return {
    params: Promise.resolve({ id }),
    searchParams: Promise.resolve({ plan }),
  };
}

afterEach(cleanup);

describe("DemoPage", () => {
  beforeEach(() => {
    mockHeaders.mockResolvedValue(new Headers());
    mockFlag.mockResolvedValue(true);
    mockLimits.mockResolvedValue(LIMITS);
    mockFindSession.mockResolvedValue(SESSION);
  });

  it("throws notFound when flag is off", async () => {
    mockFlag.mockResolvedValue(false);
    await expect(DemoPage(makeParams())).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("throws notFound when session does not exist", async () => {
    mockFindSession.mockResolvedValue(null);
    await expect(DemoPage(makeParams())).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("redirects to Google for ?plan=basic", async () => {
    await expect(DemoPage(makeParams("sess1", "basic"))).rejects.toThrow(
      "NEXT_REDIRECT:https://g.co/write",
    );
  });

  it("shows ExpiredDemo instead of redirecting when session is expired with ?plan=basic", async () => {
    mockFindSession.mockResolvedValue({
      ...SESSION,
      expiresAt: new Date(Date.now() - 1000),
    });
    const el = await DemoPage(makeParams("sess1", "basic"));
    render(el);
    expect(screen.getByTestId("expired-demo")).toBeDefined();
  });

  it("renders ExpiredDemo when session is expired", async () => {
    mockFindSession.mockResolvedValue({
      ...SESSION,
      expiresAt: new Date(Date.now() - 1000),
    });
    const el = await DemoPage(makeParams());
    render(el);
    expect(screen.getByTestId("expired-demo")).toBeDefined();
  });

  it("renders UsedUpDemo when shop has no tries left", async () => {
    mockFindSession.mockResolvedValue({ ...SESSION, place: { ...PLACE, generationsUsed: 5 } });
    const el = await DemoPage(makeParams());
    render(el);
    expect(screen.getByTestId("used-up-demo")).toBeDefined();
  });

  it("renders DemoScan when session is valid and has tries left", async () => {
    const el = await DemoPage(makeParams());
    render(el);
    expect(screen.getByTestId("demo-scan")).toBeDefined();
  });
});
