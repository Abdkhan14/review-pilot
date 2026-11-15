"use client";

import { QrCode } from "lucide-react";

type Props = { loading?: boolean };

export function DemoQrPlaceholder({ loading = false }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-4 items-start">
        {/* Dashed QR box — same 80px footprint as the real QR SVG */}
        <div className="size-20 shrink-0 rounded border-2 border-dashed border-zinc-300 flex items-center justify-center text-zinc-400">
          <QrCode className="size-8" />
        </div>

        <div className="flex flex-col gap-1 pt-1">
          <p className="text-sm font-semibold text-zinc-900">Your demo QR code</p>
          <div className="flex items-center gap-1.5">
            {/* Still grey dot — matches the layout of the green live dot */}
            <span className="size-2.5 rounded-full bg-zinc-300 shrink-0" />
            <p className="text-xs text-zinc-500">
              {loading ? "Creating your demo…" : "Your QR code will appear here"}
            </p>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Pick your shop and generate a link. Scan it with your phone to see exactly
        what your customers will see.
      </p>
    </div>
  );
}
