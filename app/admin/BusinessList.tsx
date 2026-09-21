import Link from "next/link";
import { tokens } from "@/app/tokens";
import { Badge } from "@/components/ui/badge";

type BusinessRow = {
  id: string;
  name: string;
  tier: string;
  slug: string;
  placeId: string;
};

type Props = {
  businesses: BusinessRow[];
};

export function BusinessList({ businesses }: Props) {
  if (businesses.length === 0) {
    return (
      <p className="mt-6 text-sm text-zinc-500">
        No businesses yet — add one above.
      </p>
    );
  }
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {businesses.map((biz) => (
        <li key={biz.slug}>
          <Link
            href={`/admin/businesses/${biz.id}`}
            className={`block rounded-lg border ${tokens.border} bg-white p-4 shadow-sm hover:bg-zinc-50 transition-colors`}
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-medium">{biz.name}</span>
              <Badge variant={biz.tier === "SAAS" ? "success" : "outline"}>
                {biz.tier}
              </Badge>
            </div>
            <div className="mt-1 text-sm text-zinc-500">{biz.slug}</div>
            <div className="mt-1 text-xs text-zinc-400">Place ID: {biz.placeId}</div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
