import { QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import { QrStage } from "./QrStage";

type Props = { loading?: boolean };

export function DemoQrPlaceholder({ loading = false }: Props) {
  return (
    <div className="flex flex-col items-center gap-4">
      <QrStage
        title="Your demo QR code"
        live={false}
        status={loading ? "Creating your demo…" : "Your QR code will appear here"}
      >
        <div className="flex size-full items-center justify-center">
          <QrCode
            className={cn("size-20 text-zinc-300", loading && "motion-safe:animate-pulse")}
            strokeWidth={1.25}
          />
        </div>
      </QrStage>
      <p className="max-w-xs text-center text-xs leading-relaxed text-zinc-500">
        Pick your shop and generate a link. Scan it with your phone to see exactly
        what your customers will see.
      </p>
    </div>
  );
}
