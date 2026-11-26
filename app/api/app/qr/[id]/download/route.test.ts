import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/session", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/lib/business-repo", () => ({ findOwned: vi.fn() }));
vi.mock("@/lib/encode-qr", () => ({ encodeQrPng: vi.fn(), encodeQrSvg: vi.fn() }));
vi.mock("@/lib/settings", () => ({
  getLimits: vi.fn().mockResolvedValue({ "trial.generationLimit": 5, "trial.handoffLimit": 2 }),
}));

import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { findOwned } from "@/lib/business-repo";
import { encodeQrSvg } from "@/lib/encode-qr";
import { GET } from "./route";

const mockFindOwned = vi.mocked(findOwned);
const mockSvg = vi.mocked(encodeQrSvg);

const TRIAL_QR = {
  id: "biz_1",
  slug: "joes-pizza-ab12",
  sponsoredPlan: null,
  subscriptionStatus: null,
  cancelAtPeriodEnd: false,
  basicPaidAt: null,
  trialStartedAt: new Date(),
  trialGenerations: 0,
  trialHandoffs: 0,
};

const download = (format: string) =>
  GET(new NextRequest(`http://localhost/api/app/qr/biz_1/download?format=${format}`), {
    params: Promise.resolve({ id: "biz_1" }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.APP_URL = "https://reviewpilot.app";
  vi.mocked(getSessionUser).mockResolvedValue({ id: "usr_maria", name: "M", email: "m@x.com", role: "user" });
  mockSvg.mockResolvedValue("<svg/>");
});

describe("GET /api/app/qr/[id]/download", () => {
  it("downloads a /q/ QR for an active QR", async () => {
    mockFindOwned.mockResolvedValue(TRIAL_QR as never);
    const res = await download("svg");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toBe('attachment; filename="joes-pizza-ab12.svg"');
    expect(mockSvg).toHaveBeenCalledWith("https://reviewpilot.app/q/joes-pizza-ab12");
  });

  it("refuses while the QR is inactive", async () => {
    mockFindOwned.mockResolvedValue({ ...TRIAL_QR, trialHandoffs: 2 } as never);
    const res = await download("png");
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "inactive" });
  });

  it("returns 404 for a QR the caller doesn't own", async () => {
    mockFindOwned.mockResolvedValue(null);
    expect((await download("png")).status).toBe(404);
  });
});
