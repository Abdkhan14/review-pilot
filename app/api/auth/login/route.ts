import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { timingSafeEqual, signSession } from "@/lib/auth";
import { ADMIN_COOKIE, SEVEN_DAYS, adminCookieOptions } from "@/lib/session-cookie";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === "string" ? body.password : "";

  const valid = timingSafeEqual(password, process.env.ADMIN_PASSWORD ?? "");
  if (!valid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = await signSession({ role: "admin" });
  (await cookies()).set(ADMIN_COOKIE, token, adminCookieOptions(SEVEN_DAYS));

  return NextResponse.json({ ok: true });
}
