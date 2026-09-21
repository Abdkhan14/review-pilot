import { notFound, redirect } from "next/navigation";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildWriteReviewUrl } from "@/lib/write-review-url";
import { ScanDrafts } from "./_components/ScanDrafts";

/** Do not prerender — slug lookup must run against Turso on each scan. */
export const dynamic = "force-dynamic";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await findBySlug(db, slug);
  if (!business) notFound();

  if (business.tier === "BASIC") {
    if (!business.writeReviewUrl) notFound();
    redirect(business.writeReviewUrl);
  }

  const googleUrl =
    business.writeReviewUrl ?? buildWriteReviewUrl(business.placeId);

  return (
    <main>
      <h1 className="pb-6 text-lg font-semibold">
        Pick a review to share
      </h1>
      <ScanDrafts slug={slug} writeReviewUrl={googleUrl} />
    </main>
  );
}
