import { notFound } from "next/navigation";
import { findById } from "@/lib/business-repo";
import { db } from "@/lib/db";
import EditBusinessForm from "./EditBusinessForm";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await findById(db, id);
  if (!business) notFound();

  return (
    <main className="px-4 pt-16">
      <h1 className="text-xl font-semibold">Edit business</h1>
      <EditBusinessForm
        id={business.id}
        name={business.name}
        slug={business.slug}
        initialTier={business.tier as "BASIC" | "SAAS"}
        initialCustomInstructions={business.customInstructions ?? null}
      />
    </main>
  );
}
