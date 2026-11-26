import { describe, it, expect } from "vitest";
import {
  canTestScan,
  effectivePlan,
  planCardState,
  scanOutcome,
  trialRemaining,
  type PlanFields,
} from "./plan";

const LIMITS = { "trial.generationLimit": 5, "trial.handoffLimit": 2 };
const NOV_2 = new Date("2026-11-02T00:00:00Z");

function qr(overrides: Partial<PlanFields> = {}): PlanFields {
  return {
    sponsoredPlan: null,
    subscriptionStatus: null,
    cancelAtPeriodEnd: false,
    basicPaidAt: null,
    trialStartedAt: null,
    trialGenerations: 0,
    trialHandoffs: 0,
    ...overrides,
  };
}

const onTrial = (overrides: Partial<PlanFields> = {}) => qr({ trialStartedAt: NOV_2, ...overrides });

describe("effectivePlan", () => {
  it("is inactive for a QR with no plan", () => {
    expect(effectivePlan(qr(), LIMITS)).toBe("inactive");
  });

  it("is trial while both counts are under their limits", () => {
    expect(effectivePlan(onTrial({ trialGenerations: 4, trialHandoffs: 1 }), LIMITS)).toBe("trial");
  });

  it.each([
    ["generations", { trialGenerations: 5 }],
    ["handoffs", { trialHandoffs: 2 }],
  ])("ends the trial when %s reach the limit", (_name, used) => {
    expect(effectivePlan(onTrial(used), LIMITS)).toBe("inactive");
  });

  it("is basic once paid, even after the trial ends", () => {
    expect(effectivePlan(onTrial({ trialHandoffs: 2, basicPaidAt: NOV_2 }), LIMITS)).toBe("basic");
  });

  it.each(["active", "past_due"])("is assisted while the subscription is %s, over Basic", (status) => {
    expect(effectivePlan(qr({ subscriptionStatus: status, basicPaidAt: NOV_2 }), LIMITS)).toBe("assisted");
  });

  it("falls back to Basic when Assisted ends", () => {
    expect(effectivePlan(qr({ subscriptionStatus: "canceled", basicPaidAt: NOV_2 }), LIMITS)).toBe("basic");
  });

  it("is inactive when Assisted ends without Basic", () => {
    expect(effectivePlan(qr({ subscriptionStatus: "canceled" }), LIMITS)).toBe("inactive");
  });

  it.each([
    ["ASSISTED", "assisted"],
    ["BASIC", "basic"],
  ])("honours a sponsored %s plan", (sponsoredPlan, plan) => {
    expect(effectivePlan(qr({ sponsoredPlan }), LIMITS)).toBe(plan);
  });
});

describe("planCardState", () => {
  it.each<[string, PlanFields, string]>([
    ["trial", onTrial(), "trial"],
    ["Basic only", qr({ basicPaidAt: NOV_2 }), "basic"],
    ["Assisted", qr({ subscriptionStatus: "active" }), "assisted"],
    ["Assisted cancelled at period end", qr({ subscriptionStatus: "active", cancelAtPeriodEnd: true }), "ending"],
    ["card failed", qr({ subscriptionStatus: "past_due" }), "past_due"],
    ["Assisted ended with Basic", qr({ subscriptionStatus: "canceled", basicPaidAt: NOV_2 }), "fell_back"],
    ["sponsored", qr({ sponsoredPlan: "ASSISTED" }), "sponsored"],
    ["trial ended", onTrial({ trialHandoffs: 2 }), "inactive"],
  ])("%s", (_name, fields, state) => {
    expect(planCardState(fields, LIMITS)).toBe(state);
  });
});

describe("trialRemaining", () => {
  it("never goes below zero", () => {
    expect(trialRemaining(onTrial({ trialGenerations: 7, trialHandoffs: 1 }), LIMITS)).toEqual({
      generations: 0,
      handoffs: 1,
    });
  });
});

describe("scanOutcome", () => {
  it.each([
    ["basic", "google"],
    ["inactive", "inactive"],
    ["trial", "drafts"],
  ] as const)("maps %s to %s", (plan, outcome) => {
    expect(scanOutcome(plan, 0, 6)).toBe(outcome);
  });

  it("shows drafts for Assisted under the cap and the daily cap at it", () => {
    expect(scanOutcome("assisted", 5, 6)).toBe("drafts");
    expect(scanOutcome("assisted", 6, 6)).toBe("daily_cap");
  });

  it("never caps Assisted when limits are off", () => {
    expect(scanOutcome("assisted", 50, null)).toBe("drafts");
  });
});

describe("canTestScan", () => {
  const owned = { ownerId: "usr_1" };

  it("allows the owner and admins", () => {
    expect(canTestScan({ id: "usr_1", role: "user" }, owned)).toBe(true);
    expect(canTestScan({ id: "usr_9", role: "admin" }, owned)).toBe(true);
  });

  it("refuses strangers and signed-out visitors", () => {
    expect(canTestScan({ id: "usr_2", role: "user" }, owned)).toBe(false);
    expect(canTestScan(null, owned)).toBe(false);
  });
});
