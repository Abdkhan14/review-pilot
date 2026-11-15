"use client";

import { StarRow } from "./StarRow";
import { CopyButton } from "./CopyButton";

type Props = {
  text: string;
  copied?: boolean;
  onCopy?: () => void;
};

export function DraftCard({ text, copied = false, onCopy = () => {} }: Props) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      onCopy();
    } catch {
      // clipboard denied — do not flip copied
    }
  }

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy review"}
      onClick={handleCopy}
      className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-4 shadow-sm text-left cursor-pointer"
    >
      <span className="flex items-center justify-between">
        <StarRow />
        <CopyButton copied={copied} />
      </span>
      <span className="mt-3 block text-sm leading-relaxed">{text}</span>
    </button>
  );
}
