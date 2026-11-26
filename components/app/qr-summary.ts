import type { Business, BusinessHandoff } from "@prisma/client";
import { shortDate } from "@/lib/format";
import { todayCount } from "@/lib/handoff";
import { PLAN_PRICES, SPONSORED_PLAN, planCardState, type PlanFields } from "@/lib/plan";
import { handoffCap, type AppLimits } from "@/lib/settings";

export type SummaryQr = PlanFields &
  Pick<Business, "currentPeriodEnd" | "dailyHandoffLimit" | "limitsDisabled"> & {
    handoff: BusinessHandoff | null;
  };

export type QrSummary = {
  status: string;
  usage: string;
  /** "warning" flags a problem with the plan; "action" marks usage text that asks the owner to act. */
  emphasis: "none" | "warning" | "action";
};

const SCANS_OPEN_GOOGLE = "Scans open Google";

function handoffsToday(qr: SummaryQr, limits: AppLimits, now: Date): string {
  const count = todayCount(qr.handoff, now);
  const cap = handoffCap(qr, limits);
  return cap === null ? `${count} handoffs today` : `${count} of ${cap} handoffs today`;
}

/** The status and usage lines shown for a QR in the owner's list. */
export function qrSummary(qr: SummaryQr, limits: AppLimits, now = new Date()): QrSummary {
  const periodEnd = qr.currentPeriodEnd ? shortDate(qr.currentPeriodEnd) : "";
  const today = () => handoffsToday(qr, limits, now);

  switch (planCardState(qr, limits)) {
    case "trial":
      return {
        status: `${qr.trialGenerations} of ${limits["trial.generationLimit"]} generations`,
        usage: `${qr.trialHandoffs} of ${limits["trial.handoffLimit"]} handoffs`,
        emphasis: "none",
      };
    case "inactive":
      return { status: qr.trialStartedAt ? "Trial ended" : "No plan", usage: "Pick a plan", emphasis: "action" };
    case "basic":
      return {
        status: qr.basicPaidAt ? `Lifetime · paid ${shortDate(qr.basicPaidAt)}` : "Lifetime",
        usage: SCANS_OPEN_GOOGLE,
        emphasis: "none",
      };
    case "fell_back":
      return { status: "Basic · Assisted ended", usage: SCANS_OPEN_GOOGLE, emphasis: "none" };
    case "sponsored":
      return {
        status: "Sponsored",
        usage: qr.sponsoredPlan === SPONSORED_PLAN.assisted ? today() : SCANS_OPEN_GOOGLE,
        emphasis: "none",
      };
    case "assisted":
      return { status: `Renews ${periodEnd} · ${PLAN_PRICES.assisted.short}`, usage: today(), emphasis: "none" };
    case "ending":
      return { status: `Ends ${periodEnd}`, usage: today(), emphasis: "none" };
    case "past_due":
      return { status: "Card failed · update card", usage: today(), emphasis: "warning" };
  }
}
