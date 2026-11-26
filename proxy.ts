import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import { accessLevel, protectedArea, resolveGate, type Access } from "@/lib/route-gate";
import { getSessionUser } from "@/lib/session";

/**
 * Admin paths need the role, so they read the session. Owner paths only
 * check the cookie exists; /app pages and routes do the full session check.
 */
async function accessFor(req: NextRequest): Promise<Access> {
  if (protectedArea(req.nextUrl.pathname) === "owner") {
    return getSessionCookie(req) ? "user" : "none";
  }
  return accessLevel(await getSessionUser(req.headers));
}

export async function proxy(req: NextRequest) {
  const result = resolveGate(req.nextUrl.pathname, await accessFor(req));

  switch (result.action) {
    case "redirect":
      return NextResponse.redirect(new URL(result.to, req.url));
    case "unauthorized":
      return new NextResponse(null, { status: 401 });
    case "forbidden":
      return new NextResponse(null, { status: 403 });
    case "allow":
      return NextResponse.next();
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/app/:path*", "/api/app/:path*"],
};
