import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function BackLink() {
  return (
    <Link href="/app" className="inline-flex items-center gap-1.5 text-sm text-zinc-600 hover:text-zinc-900">
      <ChevronLeft className="size-3.5" aria-hidden />
      Your QR codes
    </Link>
  );
}
