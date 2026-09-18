import { tokens } from "@/app/tokens";

type BusinessRow = {
  name: string;
  tier: string;
  slug: string;
};

type Props = {
  businesses: BusinessRow[];
};

export function BusinessList({ businesses }: Props) {
  return (
    <ul className="mt-6 divide-y divide-zinc-200">
      {businesses.map((biz) => (
        <li key={biz.slug} className="py-4">
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium">{biz.name}</span>
            <span className={`text-xs border ${tokens.border} px-2 py-0.5`}>
              {biz.tier}
            </span>
          </div>
          <div className="mt-1 text-sm text-zinc-500">{biz.slug}</div>
          <div className="mt-1 text-xs text-zinc-400">Snapshot: —</div>
        </li>
      ))}
    </ul>
  );
}
