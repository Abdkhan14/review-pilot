import Link from "next/link";
import { Button } from "@/components/ui/button";

type Props = { shopName: string };

export function InactiveQr({ shopName }: Props) {
  return (
    <main className="flex flex-col gap-4">
      <h1 className="text-lg font-semibold">This QR isn&apos;t active</h1>
      <p className="text-sm leading-relaxed text-zinc-600">
        Own {shopName}? Pick a plan to continue. The sticker you printed starts working again
        right away.
      </p>
      <Button asChild size="lg" className="w-full">
        <Link href="/app">Pick a plan</Link>
      </Button>
      <hr className="border-zinc-200" />
      <p className="text-sm leading-relaxed text-zinc-600">
        Here to leave a review? Thanks for scanning. This code isn&apos;t set up right now.
      </p>
    </main>
  );
}
