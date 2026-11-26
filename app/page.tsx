import { headers } from "next/headers";
import { isNewLandingEnabled, isSelfServeEnabled } from "@/lib/flags";
import { Landing } from "@/components/landing/Landing";
import { LegacyHome } from "@/app/_components/LegacyHome";

/** Dynamic rendering — the flag check reads the request headers. */
export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const requestHeaders = await headers();
  const [newLanding, selfServe, { from }] = await Promise.all([
    isNewLandingEnabled(requestHeaders),
    isSelfServeEnabled(requestHeaders),
    searchParams,
  ]);

  if (!newLanding) return <LegacyHome />;

  return <Landing fromQr={from === "qr"} selfServe={selfServe} />;
}
