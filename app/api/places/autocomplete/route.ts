import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { isNewLandingEnabled } from "@/lib/flags";
import { ipFromHeaders, rateLimitKey, checkRateLimit } from "@/lib/rate-limit";
import { searchPlaces } from "@/lib/places-autocomplete";

const bodySchema = z.object({
  input: z.string().min(2).max(100),
  sessionToken: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  if (!(await isNewLandingEnabled(req.headers))) {
    return new NextResponse(null, { status: 404 });
  }

  const ip = ipFromHeaders(req.headers);
  if (!checkRateLimit(rateLimitKey(ip, "places"), { limit: 30 })) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { input, sessionToken } = parsed.data;

  try {
    const places = await searchPlaces(input, sessionToken);
    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ error: "upstream_failed" }, { status: 502 });
  }
}
