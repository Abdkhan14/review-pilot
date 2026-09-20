import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { ADMIN_COOKIE } from "@/lib/session-cookie";
import { resolveAdminGate } from "@/lib/admin-gate";

export async function proxy(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;

  let cookieValid = false;
  if (token) {
    try {
      await verifySession(token);
      cookieValid = true;
    } catch {
      cookieValid = false;
    }
  }

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
