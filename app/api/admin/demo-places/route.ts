import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";
import { listDemoPlaces } from "@/lib/demo-repo";
import { getLimits } from "@/lib/settings";
import { siteGenerationsToday } from "@/lib/usage";

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const now = new Date();
  const [places, limits, siteTotal] = await Promise.all([
    listDemoPlaces(db, now),
    getLimits(db),
    siteGenerationsToday(db, now),
  ]);

  const todayLinks = await db.demoSession.count({
    where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
  });

  return NextResponse.json({
    stats: {
      generationsToday: siteTotal,
      dailyBudget: limits["demo.dailyGenerations"],
      linksToday: todayLinks,
    },
    places: places.map((p) => ({
      placeId: p.placeId,
      name: p.name,
      generationsUsed: p.generationsUsed,
      generationLimit: p.generationLimit ?? limits["demo.generationsPerPlace"],
      blocked: p.blocked,
      todayCount: p.todayCount,
      sessionCount: p.sessionCount,
    })),
  });
}
