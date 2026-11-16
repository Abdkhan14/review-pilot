import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  shopName: string;
};

export function UsedUpDemo({ shopName }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        The free demo for <span className="font-medium text-zinc-900">{shopName}</span> has been used up.
      </p>
      <Button asChild className="w-full">
        <Link href="/#demo">Make your own demo</Link>
      </Button>
    </div>
  );
}
