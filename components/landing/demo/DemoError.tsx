import { Button } from "@/components/ui/button";
import type { DemoErrorCode } from "@/hooks/useCreateDemo";

const MESSAGES: Record<DemoErrorCode, { title: string; body: string }> = {
  blocked: {
    title: "Demo not available for this shop",
    body: "Pick a different shop, or get in touch and we'll show you a demo.",
  },
  place_failed: {
    title: "Couldn't load this shop",
    body: "Couldn't load this shop from Google. Try again in a minute.",
  },
  visitor_limit: {
    title: "Too many demos today",
    body: "You've made 5 demo links today. Come back tomorrow to make more.",
  },
  busy: {
    title: "Demo is busy right now",
    body: "The demo is busy today. Come back tomorrow, or start your free trial now.",
  },
  used_up: {
    title: "Demo used up for this shop",
    body: "The free demo for this shop has been used up. Try another shop, or start your free trial.",
  },
  rate_limited: {
    title: "Too many requests",
    body: "You've made several requests in a row. Wait 30 seconds and try again.",
  },
  network: {
    title: "Something went wrong",
    body: "Couldn't reach the server. Check your connection and try again.",
  },
};

type Props = {
  code: DemoErrorCode;
  onTryAgain: () => void;
};

export function DemoError({ code, onTryAgain }: Props) {
  const { title, body } = MESSAGES[code];

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-1 text-sm text-zinc-600">{body}</p>
      </div>
      <Button variant="outline" className="w-full" onClick={onTryAgain}>
        Try again
      </Button>
    </div>
  );
}
