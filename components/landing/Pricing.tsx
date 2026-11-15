import { DEFAULT_LIMITS } from "@/lib/settings";
import { DAILY_HANDOFF_LIMIT } from "@/lib/handoff";
import { PricingCard } from "./PricingCard";
import { GetStartedButton } from "./GetStartedButton";
import { Reveal } from "./Reveal";

const TRIAL_GENS = DEFAULT_LIMITS["trial.generationLimit"];
const TRIAL_HANDOFFS = DEFAULT_LIMITS["trial.handoffLimit"];

const CARDS = [
  {
    name: "Trial",
    price: "Free",
    priceNote: "one time",
    blurb: "See it working before you commit to anything.",
    features: [
      `${TRIAL_GENS} review generations`,
      `${TRIAL_HANDOFFS} handoffs to Google`,
      "Full demo flow on your phone",
    ],
    highlighted: false,
  },
  {
    name: "Basic",
    price: "$20",
    priceNote: "once, yours for life",
    blurb: "Perfect for small shops that want reviews on autopilot.",
    features: [
      "Unlimited review generations",
      "Opens your Google review page directly",
      "QR code for the counter",
      "No subscription",
    ],
    highlighted: true,
  },
  {
    name: "Assisted",
    price: "$5",
    priceNote: "per month",
    blurb: "Full-service: we write the drafts, customers post them.",
    features: [
      `Up to ${DAILY_HANDOFF_LIMIT} handoffs a day`,
      "AI-drafted reviews in your brand voice",
      "One-tap Google link for customers",
      "Monthly billing, cancel any time",
    ],
    highlighted: false,
  },
] as const;

type Props = {
  selfServe?: boolean;
};

export function Pricing({ selfServe = false }: Props) {
  return (
    <section id="pricing" aria-label="Pricing" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4 text-center">
          Simple pricing
        </h2>
        <p className="text-zinc-500 text-center mb-12">
          No hidden fees. No per-review charges.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {CARDS.map((card, i) => (
            <Reveal key={card.name} delay={i * 0.1}>
              <PricingCard
                {...card}
                ctaSlot={
                  <GetStartedButton
                    selfServe={selfServe}
                    className={card.highlighted ? "bg-white text-zinc-900 hover:bg-zinc-100 w-full" : "w-full"}
                  />
                }
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
