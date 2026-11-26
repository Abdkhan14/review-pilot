import type { Business } from "@prisma/client";
import { isDailyCapped } from "@/lib/handoff";
import type { AppLimits } from "@/lib/settings";

export type Plan = "assisted" | "basic" | "trial" | "inactive";

export type PlanCardState =
  | "trial"
  | "basic"
  | "assisted"
  | "ending"
  | "past_due"
  | "fell_back"
  | "sponsored"
  | "inactive";

export type ScanOutcome = "drafts" | "google" | "daily_cap" | "inactive";

export type PlanFields = Pick<
  Business,
  | "sponsoredPlan"
  | "subscriptionStatus"
  | "cancelAtPeriodEnd"
  | "basicPaidAt"
  | "trialStartedAt"
  | "trialGenerations"
  | "trialHandoffs"
>;

type TrialLimits = Pick<AppLimits, "trial.generationLimit" | "trial.handoffLimit">;

export const PLAN_PRICES = {
  basic: { price: "$20", period: "once", short: "$20" },
  assisted: { price: "$5", period: "/ month", short: "$5/mo" },
} as const;

/** Values of Business.sponsoredPlan, a plan an admin gives for free. */
export const SPONSORED_PLAN = { basic: "BASIC", assisted: "ASSISTED" } as const;

/** Stripe keeps a past-due subscription running while it retries the card. */
function hasLiveSubscription(b: PlanFields): boolean {
  return b.subscriptionStatus === "active" || b.subscriptionStatus === "past_due";
}

function hasBasic(b: PlanFields): boolean {
  return b.sponsoredPlan === SPONSORED_PLAN.basic || b.basicPaidAt !== null;
}

/** Trial generations and handoffs still available, never below zero. */
export function trialRemaining(b: PlanFields, limits: TrialLimits) {
  return {
    generations: Math.max(0, limits["trial.generationLimit"] - b.trialGenerations),
    handoffs: Math.max(0, limits["trial.handoffLimit"] - b.trialHandoffs),
  };
}

function trialActive(b: PlanFields, limits: TrialLimits): boolean {
  if (!b.trialStartedAt) return false;
  const left = trialRemaining(b, limits);
  return left.generations > 0 && left.handoffs > 0;
}

/** What a scan of this QR does right now. Assisted beats Basic, which beats the trial. */
export function effectivePlan(b: PlanFields, limits: TrialLimits): Plan {
  if (b.sponsoredPlan === SPONSORED_PLAN.assisted || hasLiveSubscription(b)) return "assisted";
  if (hasBasic(b)) return "basic";
  if (trialActive(b, limits)) return "trial";
  return "inactive";
}

/** Which version of the plan card the owner sees. */
export function planCardState(b: PlanFields, limits: TrialLimits): PlanCardState {
  if (b.subscriptionStatus === "past_due") return "past_due";
  if (b.subscriptionStatus === "active") return b.cancelAtPeriodEnd ? "ending" : "assisted";
  if (b.sponsoredPlan) return "sponsored";
  if (hasBasic(b)) return b.subscriptionStatus === "canceled" ? "fell_back" : "basic";
  return trialActive(b, limits) ? "trial" : "inactive";
}

/** What the scan page shows, given the plan and today's handoffs against the QR's cap. */
export function scanOutcome(plan: Plan, handoffsToday: number, cap: number | null): ScanOutcome {
  switch (plan) {
    case "basic":
      return "google";
    case "inactive":
      return "inactive";
    case "trial":
      return "drafts";
    case "assisted":
      return cap !== null && isDailyCapped(handoffsToday, cap) ? "daily_cap" : "drafts";
  }
}

/** Test scans skip all counting, so only the QR's owner or an admin may run one. */
export function canTestScan(
  user: { id: string; role: string | null } | null,
  b: Pick<Business, "ownerId">,
): boolean {
  if (!user) return false;
  return user.role === "admin" || user.id === b.ownerId;
}
