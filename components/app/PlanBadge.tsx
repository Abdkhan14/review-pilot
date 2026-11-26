import { Badge } from "@/components/ui/badge";
import type { Plan } from "@/lib/plan";

const BADGES: Record<Plan, { label: string; variant: "success" | "default" | "outline" | "danger" }> = {
  assisted: { label: "Assisted", variant: "success" },
  basic: { label: "Basic", variant: "default" },
  trial: { label: "Trial", variant: "outline" },
  inactive: { label: "Inactive", variant: "danger" },
};

export function PlanBadge({ plan }: { plan: Plan }) {
  const { label, variant } = BADGES[plan];
  return (
    <Badge variant={variant} className="rounded-full">
      {label}
    </Badge>
  );
}
