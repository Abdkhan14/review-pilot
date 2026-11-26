import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { BackLink } from "@/components/app/BackLink";
import { PlanBadge } from "@/components/app/PlanBadge";
import { qrSummary } from "@/components/app/qr-summary";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import { findOwned } from "@/lib/business-repo";
import { encodeQrSvg } from "@/lib/encode-qr";
import { todayCount } from "@/lib/handoff";
import { snapshotFromBusiness } from "@/lib/place-snapshot";
import { effectivePlan, planCardState, trialRemaining, type PlanFields } from "@/lib/plan";
import { buildQrUrl } from "@/lib/scan-url";
import { requireSignedIn } from "@/lib/session";
import { getLimits, handoffCap, type AppLimits } from "@/lib/settings";
import { DeleteQr } from "./DeleteQr";
import { HandoffsToday } from "./HandoffsToday";
import { InactivePanel } from "./InactivePanel";
import { PlanCard } from "./PlanCard";
import { QrBlock } from "./QrBlock";
import { ShopNotesCard } from "./ShopNotesCard";

/** Do not prerender — the plan and counts change on every scan. */
export const dynamic = "force-dynamic";

function inactiveReason(qr: PlanFields, limits: AppLimits): string {
  if (!qr.trialStartedAt) return "This QR has no plan yet.";
  const left = trialRemaining(qr, limits);
  return left.handoffs === 0
    ? `Your trial ended after ${limits["trial.handoffLimit"]} handoffs.`
    : `Your trial ended after ${limits["trial.generationLimit"]} generations.`;
}

export default async function QrDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireSignedIn(`/app/qr/${id}`);
  const qr = await findOwned(db, id, user.id);
  if (!qr) notFound();

  const limits = await getLimits(db);
  const plan = effectivePlan(qr, limits);
  const scanUrl = buildQrUrl(process.env.APP_URL ?? "", qr.slug);
  const svg = plan === "inactive" ? null : await encodeQrSvg(scanUrl);

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">{qr.name}</h1>
            <PlanBadge plan={plan} />
          </div>
          <p className="mt-1.5 text-zinc-600">{snapshotFromBusiness(qr).address}</p>
        </div>
        <Button asChild variant="outline" size="lg" className="self-start sm:self-auto">
          <a href={`/q/${qr.slug}?testing=true`} target="_blank" rel="noreferrer">
            <ExternalLink className="mr-2 size-4" aria-hidden />
            Test scan
          </a>
        </Button>
      </div>

      <div className="grid items-start gap-6 md:grid-cols-[20rem_1fr]">
        {svg ? (
          <QrBlock id={qr.id} slug={qr.slug} scanUrl={scanUrl} svg={svg} />
        ) : (
          <InactivePanel reason={inactiveReason(qr, limits)} />
        )}
        <div className="flex flex-col gap-6">
          <PlanCard
            state={planCardState(qr, limits)}
            statusLine={qrSummary(qr, limits).status}
            trial={{
              started: qr.trialStartedAt !== null,
              generationsUsed: qr.trialGenerations,
              generationLimit: limits["trial.generationLimit"],
              handoffsUsed: qr.trialHandoffs,
              handoffLimit: limits["trial.handoffLimit"],
            }}
          />
          {plan === "assisted" && (
            <HandoffsToday count={todayCount(qr.handoff, new Date())} cap={handoffCap(qr, limits)} />
          )}
          <ShopNotesCard
            id={qr.id}
            initialNotes={qr.customInstructions ?? ""}
            detailsFetchedAt={qr.detailsFetchedAt?.toISOString() ?? null}
          />
          <DeleteQr
            id={qr.id}
            name={qr.name}
            consequence={qr.trialStartedAt ? "Your trial isn't given back." : ""}
          />
        </div>
      </div>
    </div>
  );
}
