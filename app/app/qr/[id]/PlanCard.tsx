import { Progress } from "@/components/ui/progress";
import { PlanBadge } from "@/components/app/PlanBadge";
import type { PlanCardState } from "@/lib/plan";
import { PaidPlanButtons } from "./PaidPlanButtons";
import { Panel } from "./Panel";

type Trial = {
  started: boolean;
  generationsUsed: number;
  generationLimit: number;
  handoffsUsed: number;
  handoffLimit: number;
};

type Props = {
  state: PlanCardState;
  trial: Trial;
  /** One-line status for paid and sponsored plans, e.g. "Renews Dec 20 · $5/mo". */
  statusLine: string;
};

const PLAN_TITLES: Record<Exclude<PlanCardState, "trial" | "inactive">, string> = {
  basic: "Basic",
  fell_back: "Basic",
  assisted: "Assisted",
  ending: "Assisted",
  past_due: "Assisted",
  sponsored: "Sponsored",
};

function Meter({ label, used, limit }: { label: string; used: number; limit: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between text-sm text-zinc-600">
        <span>{label}</span>
        <span className="font-mono text-zinc-900">
          {used} / {limit}
        </span>
      </div>
      <Progress value={used} max={limit} label={label} />
    </div>
  );
}

function TrialMeters({ trial }: { trial: Trial }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Meter label="Generations" used={trial.generationsUsed} limit={trial.generationLimit} />
      <Meter label="Handoffs" used={trial.handoffsUsed} limit={trial.handoffLimit} />
    </div>
  );
}

export function PlanCard({ state, trial, statusLine }: Props) {
  if (state === "trial") {
    return (
      <Panel title="Plan" aside={<PlanBadge plan="trial" />}>
        <p className="text-2xl font-bold tracking-tight text-zinc-900">Free trial</p>
        <TrialMeters trial={trial} />
        <p className="text-sm text-zinc-500">
          Ends at whichever comes first. Pick a plan now so there&apos;s no gap.
        </p>
        <PaidPlanButtons />
      </Panel>
    );
  }

  if (state === "inactive") {
    return (
      <Panel title="Plan" aside={<span className="text-sm font-medium text-red-600">No plan</span>}>
        <p className="text-lg text-zinc-900">{trial.started ? "Free trial ended" : "No plan yet"}</p>
        {trial.started && (
          <>
            <TrialMeters trial={trial} />
            <p className="text-sm text-zinc-500">The trial ends at whichever limit comes first.</p>
          </>
        )}
      </Panel>
    );
  }

  return (
    <Panel title="Plan">
      <p className="text-2xl font-bold tracking-tight text-zinc-900">{PLAN_TITLES[state]}</p>
      <p className="text-zinc-700">{statusLine}</p>
    </Panel>
  );
}
