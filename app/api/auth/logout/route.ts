import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ADMIN_COOKIE, adminCookieOptions } from "@/lib/session-cookie";

export async function POST() {
  (await cookies()).set(ADMIN_COOKIE, "", adminCookieOptions(0));
  return NextResponse.json({ ok: true });
}
