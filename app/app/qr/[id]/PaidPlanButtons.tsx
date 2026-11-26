import { Button } from "@/components/ui/button";
import { PLAN_PRICES } from "@/lib/plan";

/** Basic and Assisted checkout buttons. Checkout isn't available yet, so both are disabled. */
export function PaidPlanButtons() {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" size="lg" disabled>
          Basic · {PLAN_PRICES.basic.short}
        </Button>
        <Button size="lg" disabled>
          Assisted · {PLAN_PRICES.assisted.short}
        </Button>
      </div>
      <p className="text-xs text-zinc-500">Paid plans are available soon.</p>
    </div>
  );
}
