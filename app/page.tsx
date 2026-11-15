import { cookies } from "next/headers";
import { isNewLandingEnabled, isSelfServeEnabled } from "@/lib/flags";
import { Landing } from "@/components/landing/Landing";
import { LegacyHome } from "@/app/_components/LegacyHome";

/** Dynamic rendering — the flag check requires the cookie store. */
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const cookieStore = await cookies();
  const [newLanding, selfServe, { from }] = await Promise.all([
    isNewLandingEnabled(cookieStore),
    isSelfServeEnabled(cookieStore),
    searchParams,
  ]);

  if (!newLanding) return <LegacyHome />;

  return <Landing fromQr={from === "qr"} selfServe={selfServe} />;
}
