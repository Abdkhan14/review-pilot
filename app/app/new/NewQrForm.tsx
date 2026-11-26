"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PlaceSearch } from "@/components/places/PlaceSearch";
import { PlanPicker, type PlanChoice, type PlanOption } from "@/components/app/PlanPicker";
import { useCreateQr, type CreateQrError } from "@/hooks/useCreateQr";
import { usePlaceSearch, type PlaceSuggestion } from "@/hooks/usePlaceSearch";
import { PLAN_PRICES } from "@/lib/plan";
import { SHOP_NOTES_HELP, SHOP_NOTES_PLACEHOLDER } from "@/lib/shop-notes";

type TrialUse = { date: string; qrName: string | null };

type Props = {
  trialUse: TrialUse | null;
  limits: { trialGenerations: number; trialHandoffs: number; assistedDailyHandoffs: number };
};

const PAID_PLANS_NOTE = "Available soon";

function planOptions({ trialUse, limits }: Props): PlanOption[] {
  const usedOn = trialUse?.qrName ? ` on ${trialUse.qrName}` : "";
  return [
    {
      value: "trial",
      title: "Free trial",
      price: "Free",
      description: trialUse
        ? `You used your free trial${usedOn} on ${trialUse.date}.`
        : `Customers see drafts. Ends after ${limits.trialGenerations} generations or ${limits.trialHandoffs} handoffs. Once per account.`,
      disabled: trialUse !== null,
    },
    {
      value: "basic",
      title: "Basic",
      price: `${PLAN_PRICES.basic.price} ${PLAN_PRICES.basic.period}`,
      description: "A scan opens your Google review page directly. Lifetime, no limits.",
      disabled: true,
      disabledNote: PAID_PLANS_NOTE,
    },
    {
      value: "assisted",
      title: "Assisted",
      price: `${PLAN_PRICES.assisted.price} ${PLAN_PRICES.assisted.period}`,
      description: `Customers pick from 3 drafts. Up to ${limits.assistedDailyHandoffs} handoffs a day. Cancel any time.`,
      disabled: true,
      disabledNote: PAID_PLANS_NOTE,
    },
  ];
}

function errorMessage(error: CreateQrError, shopName: string | undefined): string {
  switch (error) {
    case "place_failed":
      return `Couldn't load ${shopName ?? "your shop"} from Google. Try again in a minute.`;
    case "trial_used":
      return "You've already used your free trial.";
    case "unknown":
      return "Couldn't create your QR. Try again.";
  }
}

function Step({ number, title, children }: { number: number; title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-6">
      <h2 className="text-[17px] font-semibold text-zinc-900">
        <span className="mr-1.5 text-zinc-500">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function NewQrForm(props: Props) {
  const router = useRouter();
  const search = usePlaceSearch();
  const { createQr, loading, error } = useCreateQr();
  const [place, setPlace] = useState<PlaceSuggestion | null>(null);
  const [notes, setNotes] = useState("");
  const [plan, setPlan] = useState<PlanChoice | null>(props.trialUse ? null : "trial");
  const [missingPlace, setMissingPlace] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!place) {
      setMissingPlace(true);
      return;
    }
    if (plan !== "trial") return;
    const qr = await createQr({ placeId: place.placeId, notes, plan, sessionToken: search.sessionToken });
    if (qr) router.push(`/app/qr/${qr.id}`);
  }

  function selectPlace(selected: PlaceSuggestion) {
    setPlace(selected);
    setMissingPlace(false);
    search.setQuery("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Step number={1} title="Find your shop">
        <PlaceSearch
          label="Shop name on Google"
          query={search.query}
          onQueryChange={search.setQuery}
          suggestions={search.state.status === "results" ? search.state.places : []}
          showDropdown={!place && search.state.status === "results"}
          selected={place}
          onSelect={selectPlace}
          onClear={() => setPlace(null)}
          invalid={missingPlace}
        />
        {missingPlace ? (
          <p className="text-sm text-red-600">Pick your shop from the list.</p>
        ) : (
          <p className="text-sm text-zinc-500">
            We save your shop&apos;s public Google info once. Refresh it any time from the QR&apos;s page.
          </p>
        )}
      </Step>

      <Step number={2} title={<>Shop notes <span className="font-normal text-zinc-500">(optional)</span></>}>
        <p className="text-sm text-zinc-600">{SHOP_NOTES_HELP}</p>
        <Textarea
          aria-label="Shop notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={10}
          maxLength={4000}
          placeholder={SHOP_NOTES_PLACEHOLDER}
          className="font-mono"
        />
      </Step>

      <Step number={3} title="Pick a plan">
        <PlanPicker options={planOptions(props)} value={plan} onChange={setPlan} />
        <p className="text-sm text-zinc-500">
          You can add Basic or Assisted later from the QR&apos;s page. Basic and Assisted stack: when
          Assisted ends, scans fall back to Basic.
        </p>
      </Step>

      {error && <Alert variant="destructive">{errorMessage(error, place?.name)}</Alert>}

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" className="w-full" disabled={loading || plan === null}>
          {loading ? "Creating…" : "Create QR and start trial"}
        </Button>
        <p className="text-center text-sm text-zinc-500">Your QR is ready to download right away.</p>
      </div>
    </form>
  );
}
