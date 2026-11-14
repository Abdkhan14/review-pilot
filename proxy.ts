import { NextRequest, NextResponse } from "next/server";
import { resolveAdminGate } from "@/lib/admin-gate";
import { hasAdminCookie } from "@/lib/admin-cookie";

export async function proxy(req: NextRequest) {
  const cookieValid = await hasAdminCookie(req);
  const result = resolveAdminGate(req.nextUrl.pathname, cookieValid);

  if (result.action === "redirect") {
    return NextResponse.redirect(new URL(result.to, req.url));
  }

  if (result.action === "unauthorized") {
    return new NextResponse(null, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
