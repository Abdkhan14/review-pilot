import { cn } from "@/lib/utils";

type Props = {
  name: string;
  price: string;
  priceNote: string;
  blurb: string;
  features: readonly string[];
  highlighted?: boolean;
  ctaSlot: React.ReactNode;
};

export function PricingCard({
  name,
  price,
  priceNote,
  blurb,
  features,
  highlighted = false,
  ctaSlot,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border p-8 gap-6",
        highlighted
          ? "border-zinc-900 bg-zinc-900 text-white"
          : "border-zinc-200 bg-white text-zinc-900",
      )}
    >
      <div>
        <p className={cn("text-sm font-semibold uppercase tracking-widest mb-3",
          highlighted ? "text-zinc-400" : "text-zinc-500")}>{name}</p>
        <p className={cn("text-4xl font-bold", highlighted ? "text-white" : "text-zinc-900")}>
          {price}
        </p>
        <p className={cn("text-sm mt-1", highlighted ? "text-zinc-400" : "text-zinc-500")}>
          {priceNote}
        </p>
      </div>
      <p className={cn("text-sm leading-relaxed", highlighted ? "text-zinc-300" : "text-zinc-600")}>
        {blurb}
      </p>
      <ul className="flex flex-col gap-2 flex-1">
        {features.map((text) => (
          <li key={text} className={cn("text-sm flex gap-2 items-start",
            highlighted ? "text-zinc-300" : "text-zinc-600")}>
            <span aria-hidden>✓</span>
            {text}
          </li>
        ))}
      </ul>
      {ctaSlot}
    </div>
  );
}
