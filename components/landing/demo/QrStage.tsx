import type { ReactNode } from "react";
import { Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  live: boolean;
  status: string;
  children: ReactNode;
};

function LiveStatus({ status }: { status: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_-6px_rgba(5,150,105,0.6)]">
      <span className="relative flex size-3 shrink-0">
        <span className="absolute inline-flex size-full rounded-full bg-white opacity-80 motion-safe:animate-ping" />
        <span className="relative inline-flex size-3 rounded-full bg-white" />
      </span>
      <Smartphone className="size-4" />
      {status}
    </div>
  );
}

function WaitingStatus({ status }: { status: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-500">
      <span className="size-2 rounded-full bg-zinc-300 shrink-0" />
      {status}
    </div>
  );
}

export function QrStage({ title, live, status, children }: Props) {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <div className="relative">
        {live && (
          <div
            aria-hidden
            className="absolute -inset-2 rounded-[1.25rem] border-2 border-emerald-400 motion-safe:animate-pulse"
          />
        )}
        <div
          className={cn(
            "relative size-52 rounded-2xl p-3",
            live
              ? "bg-white border border-zinc-200 shadow-[0_16px_32px_-16px_rgba(24,24,27,0.25)]"
              : "bg-zinc-50 border-2 border-dashed border-zinc-300",
          )}
        >
          {children}
        </div>
      </div>
      {live ? <LiveStatus status={status} /> : <WaitingStatus status={status} />}
    </div>
  );
}
