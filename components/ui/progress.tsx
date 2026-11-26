import { cn } from "@/lib/utils";

type Props = {
  value: number;
  max: number;
  label: string;
  className?: string;
};

export function Progress({ value, max, label, className }: Props) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-zinc-100", className)}
    >
      <div className="h-full rounded-full bg-zinc-900" style={{ width: `${pct}%` }} />
    </div>
  );
}
