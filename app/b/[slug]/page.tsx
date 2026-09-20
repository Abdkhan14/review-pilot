import { notFound, redirect } from "next/navigation";
import { findBySlug, update } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { fetchPlaceDetails } from "@/lib/places-details";

export default async function ScanPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await findBySlug(db, slug);
  if (!business) notFound();

  if (business.tier === "BASIC") {
    let writeReviewUrl = business.writeReviewUrl;

    // Lazy-heal: old rows created before the Places integration have no URL.
    // Fetch once, persist all three fields, then redirect. Future scans skip this.
    if (!writeReviewUrl) {
      try {
        const snapshot = await fetchPlaceDetails(business.placeId);
        await db.business.update({
          where: { id: business.id },
          data: {
            writeReviewUrl: snapshot.writeReviewUrl,
            details: JSON.stringify(snapshot),
            detailsFetchedAt: new Date(),
          },
        });
        writeReviewUrl = snapshot.writeReviewUrl;
      } catch {
        // If Places API is unavailable, fall through — writeReviewUrl stays null
        // and we cannot redirect. Show a generic error to the scanner.
        return (
          <main>
            <p>This review link is temporarily unavailable. Please try again later.</p>
          </main>
        );
      }
    }

    redirect(writeReviewUrl);
  }

  // SAAS: render nothing until M7 adds the draft cards
  return null;
}
