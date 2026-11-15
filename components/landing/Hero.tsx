import { DraftCard } from "@/components/scan/DraftCard";

const DEMO_REVIEW =
  "Great spot — the team remembered my usual order without me saying a word. Five stars without hesitation.";

type Props = {
  /** CTA slot — provided by the parent once a sheet is wired. */
  ctaSlot?: React.ReactNode;
};

export function Hero({ ctaSlot }: Props) {
  return (
    <section className="px-6 py-20 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
      <div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight text-zinc-900 mb-6">
          Google reviews, minus the hard part.
        </h1>
        <p className="text-lg text-zinc-500 leading-relaxed mb-8">
          A QR on the counter. Customers pick a draft. They paste it on Google.
        </p>
        {ctaSlot}
      </div>

      {/* Phone mock showing a draft card */}
      <div className="flex justify-center md:justify-end">
        <div className="w-64 rounded-3xl border-2 border-zinc-200 bg-white shadow-lg overflow-hidden">
          <div className="bg-zinc-100 h-6 flex items-center justify-center">
            <div className="w-16 h-1 rounded-full bg-zinc-300" />
          </div>
          <div className="p-4">
            <DraftCard text={DEMO_REVIEW} />
          </div>
        </div>
      </div>
    </section>
  );
}
