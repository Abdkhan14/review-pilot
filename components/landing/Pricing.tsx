import { DEFAULT_LIMITS } from "@/lib/settings";
import { DAILY_HANDOFF_LIMIT } from "@/lib/handoff";
import { Section } from "./Section";
import { PricingCard } from "./PricingCard";
import { GetStartedButton } from "./GetStartedButton";
import { Reveal } from "./Reveal";

const TRIAL_GENS = DEFAULT_LIMITS["trial.generationLimit"];
const TRIAL_HANDOFFS = DEFAULT_LIMITS["trial.handoffLimit"];
const DEMO_GENS = DEFAULT_LIMITS["demo.generationsPerPlace"];

type Props = {
  selfServe?: boolean;
};

export function Pricing({ selfServe = false }: Props) {
  return (
    <section id="pricing" aria-label="Pricing" className="py-24 bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6">
        <Section
          eyebrow="Pricing"
          heading="Simple pricing"
          lead="No hidden fees. No per-review charges."
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10">
          <Reveal>
            <PricingCard
              name="Trial"
              price="Free"
              priceNote="Once per account"
              blurb="See it working before you commit to anything."
              features={[
                `${TRIAL_GENS} AI-generated review drafts`,
                `${TRIAL_HANDOFFS} handoffs to Google`,
                `Up to ${DEMO_GENS} demo scans`,
              ]}
              ctaSlot={
                <GetStartedButton
                  selfServe={selfServe}
                  label="Start free trial"
                  variant="outline"
                  className="w-full"
                />
              }
            />
          </Reveal>

          <Reveal delay={0.1}>
            <PricingCard
              name="Basic"
              price="$20"
              priceSuffix="once"
              priceNote="Yours for life"
              blurb="Everything you need to collect reviews on autopilot."
              features={[
                "Unlimited review generations",
                "Customers post to Google in one tap",
                "Instant QR download — print it yourself",
                "No subscription, no renewal",
              ]}
              ctaSlot={
                <GetStartedButton
                  selfServe={selfServe}
                  label="Get Basic"
                  variant="outline"
                  className="w-full"
                />
              }
            />
          </Reveal>

          <Reveal delay={0.2}>
            <PricingCard
              name="Assisted"
              price="$5"
              priceSuffix="/ month"
              priceNote="Cancel any time"
              blurb="We handle the drafts. Your customers just post."
              features={[
                `Up to ${DAILY_HANDOFF_LIMIT} handoffs per day`,
                "AI drafts tuned to your brand voice",
                "One-tap Google link for customers",
                "Dashboard to track review trends",
              ]}
              featured
              tag="Most reviews"
              ctaSlot={
                <GetStartedButton
                  selfServe={selfServe}
                  label="Get Assisted"
                  variant="default"
                  className="w-full"
                />
              }
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
