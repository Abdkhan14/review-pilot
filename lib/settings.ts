import type { PrismaClient } from "@prisma/client";
import { DAILY_HANDOFF_LIMIT } from "@/lib/handoff";

export type AppLimits = {
  "assisted.dailyHandoffLimit": number;
  "trial.generationLimit": number;
  "trial.handoffLimit": number;
  "demo.generationsPerPlace": number;
  "demo.createsPerIpPerDay": number;
  "demo.dailyGenerations": number;
};

export const DEFAULT_LIMITS: AppLimits = {
  "assisted.dailyHandoffLimit": DAILY_HANDOFF_LIMIT,
  "trial.generationLimit": 5,
  "trial.handoffLimit": 2,
  "demo.generationsPerPlace": 3,
  "demo.createsPerIpPerDay": 5,
  "demo.dailyGenerations": 200,
};

/** Load all six runtime limit settings, falling back to defaults. */
export async function getLimits(db: PrismaClient): Promise<AppLimits> {
  const rows = await db.appSetting.findMany({
    where: { key: { in: Object.keys(DEFAULT_LIMITS) } },
  });

  const overrides = Object.fromEntries(rows.map((r) => [r.key, Number(r.value)]));

  return Object.fromEntries(
    (Object.keys(DEFAULT_LIMITS) as (keyof AppLimits)[]).map((key) => [
      key,
      Number.isFinite(overrides[key]) ? overrides[key] : DEFAULT_LIMITS[key],
    ]),
  ) as AppLimits;
}
