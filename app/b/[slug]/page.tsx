import { notFound, redirect } from "next/navigation";
import { findBySlug } from "@/lib/business-repo";
import { db } from "@/lib/db";

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

  // SAAS: render nothing until M7 adds the draft cards
  return null;
}
