"use client";

import { Clipboard } from "lucide-react";
import { toast } from "sonner";

export function CopyLinkButton({ url }: { url: string }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Scan link copied");
    } catch {
      toast.error("Couldn't copy the link.");
    }
  }

  return (
    <button type="button" onClick={copy} aria-label="Copy scan link" className="text-zinc-500 hover:text-zinc-900">
      <Clipboard className="size-4" aria-hidden />
    </button>
  );
}
