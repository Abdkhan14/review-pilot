import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  live: boolean;
  status: string;
  children: ReactNode;
};

function StatusDot({ live }: { live: boolean }) {
  if (!live) return <span className="size-2.5 shrink-0 rounded-full bg-zinc-300" />;
  return (
    <span className="relative flex size-2.5 shrink-0">
      <span className="absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
      <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
    </span>
  );
}

export function QrStage({ title, live, status, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <div
        className={cn(
          "size-52 rounded-lg border p-3",
          live ? "border-zinc-200 bg-white" : "border-dashed border-zinc-300 bg-zinc-50",
        )}
      >
        {children}
      </div>
      <p
        className={cn(
          "inline-flex items-center gap-2 text-sm",
          live ? "font-medium text-zinc-900" : "text-zinc-500",
        )}
      >
        <StatusDot live={live} />
        {status}
      </p>
    </div>
  );
}
