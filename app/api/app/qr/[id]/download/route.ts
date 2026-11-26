import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { effectivePlan } from "@/lib/plan";
import { parseQrFormat, qrFileResponse } from "@/lib/qr-download";
import { requireOwnedQr } from "@/lib/require-user";
import { buildQrUrl } from "@/lib/scan-url";
import { getLimits } from "@/lib/settings";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const qr = await requireOwnedQr(req, (await ctx.params).id);
  if (qr instanceof NextResponse) return qr;

  const format = parseQrFormat(req.nextUrl.searchParams.get("format"));
  if (!format) {
    return NextResponse.json({ error: "format must be png or svg" }, { status: 400 });
  }

  if (effectivePlan(qr, await getLimits(db)) === "inactive") {
    return NextResponse.json({ error: "inactive" }, { status: 403 });
  }

  return qrFileResponse(buildQrUrl(process.env.APP_URL ?? "", qr.slug), qr.slug, format);
}
