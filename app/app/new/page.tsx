import { BackLink } from "@/components/app/BackLink";
import { db } from "@/lib/db";
import { findTrialUse } from "@/lib/business-repo";
import { shortDate } from "@/lib/format";
import { requireSignedIn } from "@/lib/session";
import { getLimits } from "@/lib/settings";
import { NewQrForm } from "./NewQrForm";

export default async function NewQrPage() {
  const user = await requireSignedIn("/app/new");
  const [limits, trialUse] = await Promise.all([getLimits(db), findTrialUse(db, user.id)]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <BackLink />
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Create a QR code</h1>
      </div>
      <NewQrForm
        trialUse={trialUse && { date: shortDate(trialUse.usedAt), qrName: trialUse.qrName }}
        limits={{
          trialGenerations: limits["trial.generationLimit"],
          trialHandoffs: limits["trial.handoffLimit"],
          assistedDailyHandoffs: limits["assisted.dailyHandoffLimit"],
        }}
      />
    </div>
  );
}
