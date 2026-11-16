import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  shopName: string;
};

export function ExpiredDemo({ shopName }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        This demo link for <span className="font-medium text-zinc-900">{shopName}</span> has expired.
        Demo links are valid for 24 hours.
      </p>
      <Button asChild className="w-full">
        <Link href="/#demo">Make your own demo</Link>
      </Button>
    </div>
  );
}
