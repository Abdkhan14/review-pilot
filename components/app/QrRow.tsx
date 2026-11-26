import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Plan } from "@/lib/plan";
import { cn } from "@/lib/utils";
import { PlanBadge } from "./PlanBadge";
import type { QrSummary } from "./qr-summary";

type Props = {
  id: string;
  name: string;
  address: string;
  slug: string;
  plan: Plan;
  summary: QrSummary;
};

export function QrRow({ id, name, address, slug, plan, summary }: Props) {
  const warning = summary.emphasis === "warning";
  return (
    <Link
      href={`/app/qr/${id}`}
      className={cn(
        "flex flex-col gap-2 rounded-xl border bg-white px-5 py-4 transition-colors hover:bg-zinc-50 md:grid md:grid-cols-[1fr_auto_13rem_11rem_auto] md:items-center md:gap-6",
        warning ? "border-amber-300" : "border-zinc-200",
      )}
    >
      {/* On desktop this wrapper dissolves so the name and badge become separate grid columns. */}
      <div className="flex items-start justify-between gap-3 md:contents">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-zinc-900">{name}</p>
          <p className="hidden truncate text-sm text-zinc-500 md:block">
            {address ? `${address} · ` : ""}/q/{slug}
          </p>
        </div>
        <PlanBadge plan={plan} />
      </div>
      <p className="text-sm">
        <span className={cn(warning ? "font-medium text-amber-700" : "text-zinc-600")}>
          {summary.status}
        </span>
        <span className="text-zinc-600 md:hidden"> · {summary.usage}</span>
      </p>
      <p
        className={cn(
          "hidden text-sm md:block",
          summary.emphasis === "action" ? "font-medium text-zinc-900 underline" : "text-zinc-600",
        )}
      >
        {summary.usage}
      </p>
      <ChevronRight className="hidden size-4 text-zinc-400 md:block" aria-hidden />
    </Link>
  );
}
