import { PhoneMock } from "./PhoneMock";
import { Reveal } from "./Reveal";

type Props = {
  ctaSlot?: React.ReactNode;
};

export function Hero({ ctaSlot }: Props) {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <Reveal>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-zinc-900 mb-6">
          Google reviews, minus the hard part.
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed mb-8">
          A QR on the counter. Customers pick a draft. They paste it on Google.
        </p>
        {ctaSlot}
      </Reveal>

      <Reveal delay={0.15} className="flex justify-center md:justify-end">
        <PhoneMock />
      </Reveal>
    </section>
  );
}
