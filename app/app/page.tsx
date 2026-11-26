import Link from "next/link";
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OwnerHomePage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Your QR codes</h1>
      <section className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-zinc-200 bg-white px-6 py-10 text-center">
        <QrCode className="size-10 text-zinc-400" strokeWidth={1.5} aria-hidden />
        <h2 className="text-lg font-semibold text-zinc-900">Make your first QR code</h2>
        <p className="max-w-sm text-sm leading-relaxed text-zinc-600">
          Find your shop on Google, add a few notes, and pick a plan. Your free trial is ready
          to use.
        </p>
        <Button asChild size="lg" className="mt-1">
          <Link href="/app/new">Create QR code</Link>
        </Button>
      </section>
    </>
  );
}
