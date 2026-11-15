"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DemoResult as DemoResultData } from "@/hooks/useCreateDemo";

type Props = {
  result: DemoResultData;
  onMakeAnother: () => void;
};

export function DemoResult({ result, onMakeAnother }: Props) {
  const [mode, setMode] = useState<"assisted" | "basic">("assisted");
  const [linkCopied, setLinkCopied] = useState(false);

  const qrSvg = mode === "assisted" ? result.assistedQrSvg : result.basicQrSvg;
  const demoUrl = mode === "assisted" ? result.assistedUrl : result.basicUrl;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(demoUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // clipboard denied
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* QR code */}
      <div
        className="w-20 h-20"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
        aria-label={`QR code for ${result.name}`}
      />

      {/* Demo link */}
      <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2">
        <span className="flex-1 text-xs text-zinc-600 truncate">{demoUrl}</span>
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

      {/* Tries left chip + Basic/Assisted toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-zinc-500">
          {result.triesLeft} {result.triesLeft === 1 ? "try" : "tries"} left
        </span>
        <div className="flex items-center rounded border border-zinc-300 overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setMode("assisted")}
            className={`px-2.5 py-1 ${mode === "assisted" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"}`}
          >
            Assisted
          </button>
          <button
            type="button"
            onClick={() => setMode("basic")}
            className={`px-2.5 py-1 ${mode === "basic" ? "bg-zinc-900 text-white" : "text-zinc-600 hover:text-zinc-900"}`}
          >
            Basic
          </button>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        {mode === "assisted"
          ? "Assisted: AI picks the best draft for your customer. They copy and open Google."
          : "Basic: QR opens Google directly. No drafts."}
      </p>

      <Button variant="outline" className="w-full" onClick={onMakeAnother}>
        Make another
      </Button>
    </div>
  );
}
