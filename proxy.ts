import { NextRequest, NextResponse } from "next/server";
import { accessLevel, resolveAdminGate } from "@/lib/admin-gate";
import { getSessionUser } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const access = accessLevel(await getSessionUser(req.headers));
  const result = resolveAdminGate(req.nextUrl.pathname, access);

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
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
