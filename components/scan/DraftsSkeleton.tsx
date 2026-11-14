"use client";

import { GENERATE_STEPS } from "@/lib/generate-progress";
import { Button } from "@/components/ui/button";

type Props = {
  activeIndex?: number;
  progressPct?: number;
  /** True once elapsed time has passed the 10 s progress window. */
  slow?: boolean;
  /** Called when the user clicks Regenerate. Only used when slow is true. */
  onRegenerate?: () => void;
};

/**
 * Presentational progress list shown while drafts are being generated.
 * Frozen at step 0 in loading.tsx; driven by a timer in ScanDrafts.
 */
export function GenerateProgress({
  activeIndex = 0,
  progressPct = 0,
  slow = false,
  onRegenerate,
}: Props) {
  return (
    <div data-testid="generate-progress" className="flex flex-col gap-8">
      <ol className="flex flex-col gap-3">
        {GENERATE_STEPS.map((step, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <li
              key={step}
              className={`text-sm transition-colors duration-300 ${
                isDone
                  ? "text-zinc-400"
                  : isActive
                  ? "text-zinc-900"
                  : "text-zinc-300"
              }`}
            >
              <span className="mr-2 tabular-nums">{i + 1}.</span>
              {step}
            </li>
          );
        })}
      </ol>

      {/* Thin fill bar — completes over GENERATE_PROGRESS_MS, holds at full */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full bg-zinc-400 transition-all duration-100 ease-linear"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {slow && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-500">
            Oops! Taking longer than expected.
          </p>
          <Button variant="outline" className="w-full" onClick={onRegenerate}>
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}
