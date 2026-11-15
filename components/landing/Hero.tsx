import { Button } from "@/components/ui/button";
import { GetStartedButton } from "./GetStartedButton";
import { PhoneMock } from "./PhoneMock";
import { Reveal } from "./Reveal";

type Props = {
  selfServe: boolean;
};

export function Hero({ selfServe }: Props) {
  return (
    <section className="bg-white">
      <div className="px-6 py-20 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <Reveal>
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-4">
          For local shops
        </p>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-zinc-900 mb-4">
          Google reviews, minus the hard part.
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed mb-8">
          A QR on the counter. Customers pick a draft. They paste it on Google.
        </p>
        <div className="flex flex-wrap gap-3 items-center mb-4">
          <GetStartedButton
            selfServe={selfServe}
            label="Start free trial"
            size="lg"
          />
          <Button asChild variant="outline" size="lg">
            <a href="/#demo">Try the live demo</a>
          </Button>
        </div>
        <p className="text-xs text-zinc-400">
          No credit card needed · QR ready in under a minute
        </p>
      </Reveal>

      <Reveal delay={0.15} className="flex justify-center md:justify-end">
        <PhoneMock />
      </Reveal>
      </div>
    </section>
  );
}
