import { Lock } from "lucide-react";
import { PLAN_PRICES } from "@/lib/plan";
import { PaidPlanButtons } from "./PaidPlanButtons";

export function InactivePanel({ reason }: { reason: string }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border-2 border-zinc-900 bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-zinc-100">
          <Lock className="size-5 text-zinc-600" aria-hidden />
        </span>
        <h2 className="text-lg font-semibold text-zinc-900">This QR isn&apos;t active</h2>
      </div>
      <p className="text-sm leading-relaxed text-zinc-600">
        {reason} Scans show an &ldquo;isn&apos;t active&rdquo; page for now. Pick a plan and the QR
        and downloads come back. Printed stickers start working again right away.
      </p>
      <dl className="flex flex-col gap-3 text-sm">
        <div className="rounded-lg border border-zinc-200 p-4">
          <dt className="flex justify-between font-semibold text-zinc-900">
            Basic <span>{PLAN_PRICES.basic.price} {PLAN_PRICES.basic.period}</span>
          </dt>
          <dd className="mt-1 text-zinc-600">Scans open your Google review page directly. Lifetime.</dd>
        </div>
        <div className="rounded-lg border border-zinc-200 p-4">
          <dt className="flex justify-between font-semibold text-zinc-900">
            Assisted <span>{PLAN_PRICES.assisted.price} {PLAN_PRICES.assisted.period}</span>
          </dt>
          <dd className="mt-1 text-zinc-600">Customers keep getting drafts, like your trial.</dd>
        </div>
      </dl>
      <PaidPlanButtons />
      <p className="text-sm text-zinc-500">Downloads are off while the QR is inactive.</p>
    </section>
  );
}
