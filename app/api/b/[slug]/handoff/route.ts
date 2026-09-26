import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { utcDay, todayCount, isDailyCapped, DAILY_HANDOFF_LIMIT } from "@/lib/handoff";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;

  const business = await findBySlug(db, slug);
  if (!business) return new NextResponse(null, { status: 404 });
  if (business.tier === "BASIC") return new NextResponse(null, { status: 403 });

  const now = new Date();
  const today = utcDay(now);

  const existing = await db.businessHandoff.findUnique({
    where: { businessId: business.id },
  });

  const count = todayCount(existing, now);

  if (!existing) {
    await db.businessHandoff.create({
      data: { businessId: business.id, count: 1, day: today },
    });
  } else if (existing.day !== today) {
    // Day has rolled over — reset
    await db.businessHandoff.update({
      where: { businessId: business.id },
      data: { count: 1, day: today },
    });
  } else if (!isDailyCapped(count)) {
    // Same day, under the cap — increment
    await db.businessHandoff.update({
      where: { businessId: business.id },
      data: { count: { increment: 1 } },
    });
  }
  // count >= DAILY_HANDOFF_LIMIT and same day: leave the row unchanged

  return new NextResponse(null, { status: 204 });
}
