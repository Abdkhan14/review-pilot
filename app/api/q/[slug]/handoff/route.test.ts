import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/business-repo", () => ({ findOwnedBySlug: vi.fn() }));
vi.mock("@/lib/usage", () => ({ recordTrialHandoff: vi.fn(), recordDailyHandoff: vi.fn() }));
vi.mock("@/lib/settings", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/settings")>()),
  getLimits: vi.fn(),
}));

import { NextRequest } from "next/server";
import { findOwnedBySlug } from "@/lib/business-repo";
import { recordDailyHandoff, recordTrialHandoff } from "@/lib/usage";
import { DEFAULT_LIMITS, getLimits } from "@/lib/settings";
import { POST } from "./route";

const mockFind = vi.mocked(findOwnedBySlug);
const mockTrial = vi.mocked(recordTrialHandoff);
const mockDaily = vi.mocked(recordDailyHandoff);

const TRIAL_QR = {
  id: "biz_1",
  sponsoredPlan: null,
  subscriptionStatus: null,
  cancelAtPeriodEnd: false,
  basicPaidAt: null,
  trialStartedAt: new Date(),
  trialGenerations: 1,
  trialHandoffs: 0,
  dailyHandoffLimit: 10,
  limitsDisabled: false,
};

const post = () =>
  POST(new NextRequest("http://localhost/api/q/joes/handoff", { method: "POST" }), {
    params: Promise.resolve({ slug: "joes" }),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getLimits).mockResolvedValue(DEFAULT_LIMITS);
  mockTrial.mockResolvedValue(true);
  mockDaily.mockResolvedValue(true);
});

describe("POST /api/q/[slug]/handoff", () => {
  it("returns 404 when no owned QR has this slug", async () => {
    mockFind.mockResolvedValue(null);
    expect((await post()).status).toBe(404);
  });

  it("counts a trial handoff against the trial limit", async () => {
    mockFind.mockResolvedValue(TRIAL_QR as never);
    expect((await post()).status).toBe(204);
    expect(mockTrial).toHaveBeenCalledWith({}, "biz_1", 2);
    expect(mockDaily).not.toHaveBeenCalled();
  });

  it("counts an Assisted handoff against the QR's own daily cap", async () => {
    mockFind.mockResolvedValue({ ...TRIAL_QR, sponsoredPlan: "ASSISTED" } as never);
    expect((await post()).status).toBe(204);
    expect(mockDaily).toHaveBeenCalledWith({}, "biz_1", 10, expect.any(Date));
  });

  it("returns 429 when the limit is already reached", async () => {
    mockFind.mockResolvedValue(TRIAL_QR as never);
    mockTrial.mockResolvedValue(false);
    expect((await post()).status).toBe(429);
  });

  it.each([
    ["Basic", { ...TRIAL_QR, basicPaidAt: new Date() }],
    ["inactive", { ...TRIAL_QR, trialHandoffs: 2 }],
  ])("refuses a %s QR without counting", async (_name, qr) => {
    mockFind.mockResolvedValue(qr as never);
    expect((await post()).status).toBe(403);
    expect(mockTrial).not.toHaveBeenCalled();
    expect(mockDaily).not.toHaveBeenCalled();
  });
});
