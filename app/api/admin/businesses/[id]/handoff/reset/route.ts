import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findById } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { utcDay } from "@/lib/handoff";

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;

  const business = await findById(db, id);
  if (!business) return new NextResponse(null, { status: 404 });

  const existing = await db.businessHandoff.findUnique({
    where: { businessId: id },
  });

  if (!existing) return new NextResponse(null, { status: 204 });

  await db.businessHandoff.update({
    where: { businessId: id },
    data: { count: 0, day: utcDay(new Date()) },
  });

  return new NextResponse(null, { status: 204 });
}
