import { cn } from "@/lib/utils";

type Props = {
  name: string;
  price: string;
  priceSuffix?: string;
  priceNote?: string;
  blurb: string;
  features: readonly string[];
  /** Featured card: white bg + double border instead of plain zinc-50. */
  featured?: boolean;
  /** Pill tag displayed above the card name (e.g. "MOST REVIEWS"). */
  tag?: string;
  ctaSlot: React.ReactNode;
};

export function PricingCard({
  name,
  price,
  priceSuffix,
  priceNote,
  blurb,
  features,
  featured = false,
  tag,
  ctaSlot,
}: Props) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-2xl p-8 gap-6",
        featured
          ? "border-2 border-zinc-900 bg-white"
          : "border border-zinc-200 bg-zinc-50",
      )}
    >
      <div>
        {tag && (
          <span className="inline-block mb-3 rounded-full bg-zinc-900 px-3 py-0.5 text-[10px] font-bold tracking-widest uppercase text-white">
            {tag}
          </span>
        )}
        <p className="text-sm font-semibold uppercase tracking-widest text-zinc-500 mb-3">
          {name}
        </p>
        <div className="flex items-baseline gap-1">
          <p className="text-4xl font-bold text-zinc-900">{price}</p>
          {priceSuffix && (
            <span className="text-base text-zinc-500">{priceSuffix}</span>
          )}
        </div>
        {priceNote && (
          <p className="text-xs text-zinc-500 mt-1">{priceNote}</p>
        )}
      </div>
      <p className="text-sm leading-relaxed text-zinc-600">{blurb}</p>
      <ul className="flex flex-col gap-2 flex-1">
        {features.map((text) => (
          <li key={text} className="text-sm flex gap-2 items-start text-zinc-600">
            <span aria-hidden className="shrink-0 text-zinc-400">✓</span>
            {text}
          </li>
        ))}
      </ul>
      {ctaSlot}
    </div>
  );
}
