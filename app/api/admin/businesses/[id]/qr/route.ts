import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findById } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { parseQrFormat, qrFileResponse } from "@/lib/qr-download";
import { scanUrlFor } from "@/lib/scan-url";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const business = await findById(db, id);
  if (!business) return new NextResponse(null, { status: 404 });

  const format = parseQrFormat(req.nextUrl.searchParams.get("format"));
  if (!format) {
    return NextResponse.json(
      { error: "format must be png or svg" },
      { status: 400 }
    );
  }

  return qrFileResponse(scanUrlFor(process.env.APP_URL ?? "", business), business.slug, format);
}
