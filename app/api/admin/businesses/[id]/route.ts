import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findById, update } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { parseUpdateBusinessInput } from "@/lib/update-business-input";
import { requireAdmin } from "@/lib/require-admin";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = parseUpdateBusinessInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const existing = await findById(db, id);
  if (!existing) return new NextResponse(null, { status: 404 });

  const updated = await update(db, id, parsed.input);
  return NextResponse.json({ slug: updated.slug, tier: updated.tier });
}
