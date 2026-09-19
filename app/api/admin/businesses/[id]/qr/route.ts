import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { findById } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { encodeQrPng, encodeQrSvg } from "@/lib/encode-qr";
import { buildScanUrl } from "@/lib/scan-url";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  const { id } = await ctx.params;
  const business = await findById(db, id);
  if (!business) return new NextResponse(null, { status: 404 });

  const format = req.nextUrl.searchParams.get("format");
  if (format !== "png" && format !== "svg") {
    return NextResponse.json(
      { error: "format must be png or svg" },
      { status: 400 }
    );
  }

  const url = buildScanUrl(process.env.APP_URL ?? "", business.slug);

  if (format === "png") {
    const buf = await encodeQrPng(url);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${business.slug}.png"`,
      },
    });
  }

  // svg
  const svg = await encodeQrSvg(url);
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${business.slug}.svg"`,
    },
  });
}
