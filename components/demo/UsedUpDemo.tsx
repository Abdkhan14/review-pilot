import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = {
  shopName: string;
  writeReviewUrl: string;
};

export function UsedUpDemo({ shopName, writeReviewUrl }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-zinc-500">
        The free demo for <span className="font-medium text-zinc-900">{shopName}</span> has been used up.
        You can still leave a review directly on Google.
      </p>
      <Button asChild variant="outline" className="w-full">
        <a href={writeReviewUrl}>Go to Google Reviews</a>
      </Button>
      <Button asChild className="w-full">
        <Link href="/#demo">Make your own demo</Link>
      </Button>
    </div>
  );
}
