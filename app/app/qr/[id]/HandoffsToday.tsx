import { Progress } from "@/components/ui/progress";
import { Panel } from "./Panel";

type Props = {
  count: number;
  /** Null when the daily cap is turned off for this QR. */
  cap: number | null;
};

export function HandoffsToday({ count, cap }: Props) {
  return (
    <Panel title="Handoffs today">
      <p className="font-mono text-3xl text-zinc-900">
        {count}
        {cap !== null && <span className="text-base text-zinc-500"> / {cap}</span>}
      </p>
      {cap !== null && <Progress value={count} max={cap} label="Handoffs today" />}
      <p className="text-sm text-zinc-500">
        A customer copied a draft and opened Google Reviews.{" "}
        {cap === null
          ? "This QR has no daily limit."
          : `At ${cap}, scans show "come back tomorrow" until midnight UTC.`}
      </p>
    </Panel>
  );
}
