import { notFound } from "next/navigation";
import { findById } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { encodeQrSvg } from "@/lib/encode-qr";
import { buildScanUrl } from "@/lib/scan-url";
import { todayCount } from "@/lib/handoff";
import EditBusinessForm from "./EditBusinessForm";
import QrPanel from "./QrPanel";
import HandoffPanel from "./HandoffPanel";
import DeleteBusinessButton from "./DeleteBusinessButton";

/** Do not prerender — business rows change after deploy. */
export const dynamic = "force-dynamic";

export default async function EditBusinessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const business = await findById(db, id);
  if (!business) notFound();

  const scanUrl = buildScanUrl(process.env.APP_URL ?? "", business.slug);

  const [svg, handoffRow] = await Promise.all([
    encodeQrSvg(scanUrl),
    db.businessHandoff.findUnique({ where: { businessId: business.id } }),
  ]);

  const handoffCount = todayCount(handoffRow, new Date());

  return (
    <main>
      <h1 className="text-xl font-semibold">Edit business</h1>
      <a
        href={`${scanUrl}?testing=true`}
        className="text-sm text-zinc-500 underline"
        target="_blank"
        rel="noreferrer"
      >
        Test this scan ↗
      </a>
      <EditBusinessForm
        id={business.id}
        name={business.name}
        slug={business.slug}
        scanUrl={scanUrl}
        initialTier={business.tier as "BASIC" | "SAAS"}
        initialCustomInstructions={business.customInstructions ?? null}
      />
      <HandoffPanel businessId={business.id} initialCount={handoffCount} />
      <QrPanel id={business.id} slug={business.slug} svg={svg} />
      <DeleteBusinessButton id={business.id} />
    </main>
  );
}
