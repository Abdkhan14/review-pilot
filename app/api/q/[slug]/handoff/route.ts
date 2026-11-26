import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { findOwnedBySlug } from "@/lib/business-repo";
import { effectivePlan } from "@/lib/plan";
import { getLimits, handoffCap } from "@/lib/settings";
import { recordDailyHandoff, recordTrialHandoff } from "@/lib/usage";

export async function POST(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const qr = await findOwnedBySlug(db, slug);
  if (!qr) return new NextResponse(null, { status: 404 });

  const limits = await getLimits(db);
  const plan = effectivePlan(qr, limits);

  let counted: boolean;
  if (plan === "trial") {
    counted = await recordTrialHandoff(db, qr.id, limits["trial.handoffLimit"]);
  } else if (plan === "assisted") {
    counted = await recordDailyHandoff(db, qr.id, handoffCap(qr, limits), new Date());
  } else {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, { status: counted ? 204 : 429 });
}
