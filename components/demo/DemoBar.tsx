"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Props = {
  shopName: string;
  triesLeft: number;
  demoId: string;
};

export function DemoBar({ shopName, triesLeft, demoId }: Props) {
  const params = useSearchParams();
  const isBasic = params.get("plan") === "basic";

  const assistedHref = `/d/${demoId}`;
  const basicHref = `/d/${demoId}?plan=basic`;

  return (
    <div className="bg-zinc-900 flex items-center justify-between gap-3 px-4 py-3 text-[13px] w-full">
      <p className="font-medium text-zinc-50 shrink-0 truncate">
        Demo · {shopName}
      </p>
      <div className="flex items-center gap-3 shrink-0">
        <p className="text-zinc-400">{triesLeft} {triesLeft === 1 ? "try" : "tries"} left</p>
        <div className="flex items-center rounded border border-zinc-700 overflow-hidden text-xs">
          <Link
            href={assistedHref}
            className={`px-2 py-1 ${!isBasic ? "bg-zinc-700 text-zinc-50" : "text-zinc-400 hover:text-zinc-200"}`}
          >
            Assisted
          </Link>
          <Link
            href={basicHref}
            className={`px-2 py-1 ${isBasic ? "bg-zinc-700 text-zinc-50" : "text-zinc-400 hover:text-zinc-200"}`}
          >
            Basic
          </Link>
        </div>
      </div>
    </div>
  );
}
