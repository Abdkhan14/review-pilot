"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DemoResult as DemoResultData } from "@/hooks/useCreateDemo";
import { QrStage } from "./QrStage";

type Mode = "assisted" | "basic";

const MODES: { value: Mode; label: string; description: string }[] = [
  {
    value: "assisted",
    label: "Assisted",
    description: "AI writes draft reviews. Your customer picks one, copies it, and opens Google.",
  },
  {
    value: "basic",
    label: "Basic",
    description: "The QR code opens Google Reviews directly. No drafts.",
  },
];

const COPIED_RESET_MS = 2000;

type Props = {
  result: DemoResultData;
  onMakeAnother: () => void;
};

export function DemoResult({ result, onMakeAnother }: Props) {
  const [mode, setMode] = useState<Mode>("assisted");
  const [linkCopied, setLinkCopied] = useState(false);

  const qrSvg = mode === "assisted" ? result.assistedQrSvg : result.basicQrSvg;
  const demoUrl = mode === "assisted" ? result.assistedUrl : result.basicUrl;
  const activeMode = MODES.find((m) => m.value === mode)!;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(demoUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), COPIED_RESET_MS);
    } catch {
      // clipboard denied
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 rounded-md border border-zinc-200 p-0.5 text-sm">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              aria-pressed={mode === m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded py-1.5 font-medium",
                mode === m.value ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-zinc-500">{activeMode.description}</p>
      </div>

      <QrStage title={result.name} live status="Scan with your phone camera">
        <div
          role="img"
          className="size-full [&>svg]:size-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
          aria-label={`QR code for ${result.name}`}
        />
      </QrStage>

      <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
        <span className="flex-1 truncate text-xs text-zinc-600">{demoUrl}</span>
        <button
          type="button"
          onClick={copyLink}
          aria-label={linkCopied ? "Copied" : "Copy demo link"}
          className="shrink-0 text-zinc-500 hover:text-zinc-900"
        >
          {linkCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
        <a
          href={demoUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Open demo link"
          className="shrink-0 text-zinc-500 hover:text-zinc-900"
        >
          <ExternalLink className="size-4" />
        </a>
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-zinc-500">
          {result.triesLeft} {result.triesLeft === 1 ? "try" : "tries"} left
        </span>
        <Button variant="outline" size="sm" onClick={onMakeAnother}>
          Make another
        </Button>
      </div>
    </div>
  );
}
