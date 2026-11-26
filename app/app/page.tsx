import Link from "next/link";
import { Plus, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QrRow } from "@/components/app/QrRow";
import { qrSummary } from "@/components/app/qr-summary";
import { db } from "@/lib/db";
import { listOwned } from "@/lib/business-repo";
import { snapshotFromBusiness } from "@/lib/place-snapshot";
import { effectivePlan } from "@/lib/plan";
import { requireSignedIn } from "@/lib/session";
import { getLimits } from "@/lib/settings";

/** Do not prerender — the list and its counts change on every scan. */
export const dynamic = "force-dynamic";

function CreateQrButton({ className }: { className?: string }) {
  return (
    <Button asChild size="lg" className={className}>
      <Link href="/app/new">
        <Plus className="mr-2 size-4" aria-hidden />
        Create QR code
      </Link>
    </Button>
  );
}

function EmptyState() {
  return (
    <section className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center">
      <QrCode className="size-10 text-zinc-400" strokeWidth={1.5} aria-hidden />
      <h2 className="text-lg font-semibold text-zinc-900">Make your first QR code</h2>
      <p className="max-w-sm text-sm leading-relaxed text-zinc-600">
        Find your shop on Google, add a few notes, and pick a plan. Your free trial is ready to
        use.
      </p>
      <CreateQrButton className="mt-1" />
    </section>
  );
}

export default async function OwnerHomePage() {
  const user = await requireSignedIn("/app");
  const [qrs, limits] = await Promise.all([listOwned(db, user.id), getLimits(db)]);

  if (qrs.length === 0) {
    return (
      <>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Your QR codes</h1>
        <EmptyState />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Your QR codes</h1>
          <p className="mt-1.5 text-sm text-zinc-600">
            One QR per shop. Each has its own plan and billing.
          </p>
        </div>
        <CreateQrButton className="w-full md:w-auto" />
      </div>
      <ul className="mt-6 flex flex-col gap-3">
        {qrs.map((qr) => (
          <li key={qr.id}>
            <QrRow
              id={qr.id}
              name={qr.name}
              address={snapshotFromBusiness(qr).address}
              slug={qr.slug}
              plan={effectivePlan(qr, limits)}
              summary={qrSummary(qr, limits)}
            />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm text-zinc-500">Handoff counts reset at midnight UTC.</p>
    </>
  );
}
