import { describe, it, expect } from "vitest";
import { DEFAULT_LIMITS } from "@/lib/settings";
import { qrSummary, type SummaryQr } from "./qr-summary";

const NOW = new Date("2026-11-22T15:00:00Z");

function qr(overrides: Partial<SummaryQr> = {}): SummaryQr {
  return {
    sponsoredPlan: null,
    subscriptionStatus: null,
    cancelAtPeriodEnd: false,
    basicPaidAt: null,
    trialStartedAt: new Date("2026-11-02T00:00:00Z"),
    trialGenerations: 3,
    trialHandoffs: 1,
    currentPeriodEnd: null,
    dailyHandoffLimit: null,
    limitsDisabled: false,
    handoff: null,
    ...overrides,
  };
}

describe("qrSummary", () => {
  it("shows trial usage against the trial limits", () => {
    expect(qrSummary(qr(), DEFAULT_LIMITS, NOW)).toEqual({
      status: "3 of 5 generations",
      usage: "1 of 2 handoffs",
      emphasis: "none",
    });
  });

  it("asks the owner to pick a plan once the trial ends", () => {
    expect(qrSummary(qr({ trialHandoffs: 2 }), DEFAULT_LIMITS, NOW)).toEqual({
      status: "Trial ended",
      usage: "Pick a plan",
      emphasis: "action",
    });
  });

  it("shows today's handoffs against the QR's own cap for sponsored Assisted", () => {
    const sponsored = qr({
      sponsoredPlan: "ASSISTED",
      dailyHandoffLimit: 10,
      handoff: { businessId: "b", count: 4, day: "2026-11-22" },
    });
    expect(qrSummary(sponsored, DEFAULT_LIMITS, NOW)).toMatchObject({
      status: "Sponsored",
      usage: "4 of 10 handoffs today",
    });
  });

  it("flags a failed card", () => {
    expect(qrSummary(qr({ subscriptionStatus: "past_due" }), DEFAULT_LIMITS, NOW)).toMatchObject({
      status: "Card failed · update card",
      emphasis: "warning",
    });
  });
});
