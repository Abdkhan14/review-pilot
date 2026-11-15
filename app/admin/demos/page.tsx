export const dynamic = "force-dynamic";

import "server-only";
import { db } from "@/lib/db";
import { listDemoPlaces } from "@/lib/demo-repo";
import { getLimits } from "@/lib/settings";
import { siteGenerationsToday } from "@/lib/usage";
import { DemoPlaceList } from "./DemoPlaceList";

export default async function AdminDemosPage() {
  const now = new Date();

  const [places, limits, siteTotal] = await Promise.all([
    listDemoPlaces(db, now),
    getLimits(db),
    siteGenerationsToday(db, now),
  ]);

  const todayLinks = await db.demoSession.count({
    where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
  });

  const dailyBudget = limits["demo.dailyGenerations"] as number;
  const defaultLimit = limits["demo.generationsPerPlace"] as number;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold text-zinc-900">Demo shops</h1>

      <div className="flex gap-3">
        <div className="flex-1 bg-white rounded-lg border border-zinc-200 p-3.5 flex flex-col gap-1">
          <p className="text-xs text-zinc-600">Generations, last 24 h</p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[22px] font-bold text-zinc-900 leading-tight">
              {siteTotal}
            </span>
            <span className="text-[13px] text-zinc-500">/ {dailyBudget}</span>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg border border-zinc-200 p-3.5 flex flex-col gap-1">
          <p className="text-xs text-zinc-600">Demo links, last 24 h</p>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-[22px] font-bold text-zinc-900 leading-tight">
              {todayLinks}
            </span>
          </div>
        </div>
      </div>

      <DemoPlaceList
        places={places.map((p) => ({
          placeId: p.placeId,
          name: p.name,
          generationsUsed: p.generationsUsed,
          generationLimit: p.generationLimit ?? defaultLimit,
          blocked: p.blocked,
          todayCount: p.todayCount,
          sessionCount: p.sessionCount,
        }))}
        defaultLimit={defaultLimit}
      />
    </div>
  );
}
