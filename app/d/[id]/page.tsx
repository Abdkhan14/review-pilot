import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getLimits } from "@/lib/settings";
import { isNewLandingEnabled } from "@/lib/flags";
import { cookies } from "next/headers";
import { findSession } from "@/lib/demo-repo";
import { isExpired, triesLeft } from "@/lib/demo";
import { buildWriteReviewUrl } from "@/lib/write-review-url";
import { DemoScan } from "@/components/demo/DemoScan";
import { ExpiredDemo } from "@/components/demo/ExpiredDemo";
import { UsedUpDemo } from "@/components/demo/UsedUpDemo";

export const dynamic = "force-dynamic";

export default async function DemoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ plan?: string }>;
}) {
  const cookieStore = await cookies();
  if (!(await isNewLandingEnabled(cookieStore))) {
    notFound();
  }

  const { id } = await params;
  const { plan } = await searchParams;

  const session = await findSession(db, id);
  if (!session) notFound();

  const { place } = session;
  const writeReviewUrl = place.writeReviewUrl ?? buildWriteReviewUrl(place.placeId);
  const now = new Date();

  if (plan === "basic") {
    redirect(writeReviewUrl);
  }

  if (isExpired(session, now) || place.blocked) {
    return (
      <main className="px-4 py-10">
        <h1 className="pb-6 text-lg font-semibold">Demo expired</h1>
        <ExpiredDemo shopName={place.name} />
      </main>
    );
  }

  const limits = await getLimits(db);
  const left = triesLeft(place, limits);

  if (left === 0) {
    return (
      <main className="px-4 py-10">
        <h1 className="pb-6 text-lg font-semibold">{place.name}</h1>
        <UsedUpDemo shopName={place.name} writeReviewUrl={writeReviewUrl} />
      </main>
    );
  }

  return (
    <DemoScan
      demoId={id}
      shopName={place.name}
      initialTriesLeft={left}
      writeReviewUrl={writeReviewUrl}
    />
  );
}
