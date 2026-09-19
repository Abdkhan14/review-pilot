import { notFound, redirect } from "next/navigation";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { buildWriteReviewUrl } from "@/lib/write-review-url";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await findBySlug(db, slug);
  if (!business) notFound();
  if (business.tier === "BASIC") {
    redirect(buildWriteReviewUrl(business.placeId));
  }
  // SAAS: render nothing until M7 adds the draft cards
  return null;
}
