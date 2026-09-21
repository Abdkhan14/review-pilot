import { notFound } from "next/navigation";
import { findById } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { encodeQrSvg } from "@/lib/encode-qr";
import { buildScanUrl } from "@/lib/scan-url";
import EditBusinessForm from "./EditBusinessForm";
import QrPanel from "./QrPanel";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await findById(db, id);
  if (!business) notFound();

  const svg = await encodeQrSvg(
    buildScanUrl(process.env.APP_URL ?? "", business.slug)
  );

  return (
    <main>
      <h1 className="text-xl font-semibold">Edit business</h1>
      <EditBusinessForm
        id={business.id}
        name={business.name}
        slug={business.slug}
        initialTier={business.tier as "BASIC" | "SAAS"}
        initialCustomInstructions={business.customInstructions ?? null}
      />
      <QrPanel id={business.id} slug={business.slug} svg={svg} />
    </main>
  );
}
