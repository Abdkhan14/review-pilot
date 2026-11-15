import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import { db } from "@/lib/db";

const bodySchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reset") }),
  z.object({ action: z.literal("raiseLimit"), limit: z.number().int().positive() }),
  z.object({ action: z.literal("block") }),
  z.object({ action: z.literal("unblock") }),
]);

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ placeId: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { placeId } = await ctx.params;

  const existing = await db.demoPlace.findUnique({ where: { placeId } });
  if (!existing) return new NextResponse(null, { status: 404 });

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { data } = parsed;

  switch (data.action) {
    case "reset":
      await db.demoPlace.update({ where: { placeId }, data: { generationsUsed: 0 } });
      break;
    case "raiseLimit":
      if (data.limit <= existing.generationsUsed) {
        return NextResponse.json(
          { error: "limit must be greater than current usage" },
          { status: 400 },
        );
      }
      await db.demoPlace.update({ where: { placeId }, data: { generationLimit: data.limit } });
      break;
    case "block":
      await db.demoPlace.update({ where: { placeId }, data: { blocked: true } });
      break;
    case "unblock":
      await db.demoPlace.update({ where: { placeId }, data: { blocked: false } });
      break;
  }

  return new NextResponse(null, { status: 204 });
}
