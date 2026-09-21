"use client";

type Props = {
  text: string;
  copied: boolean;
  onCopied: () => void;
};

export function CopyButton({ text, copied, onCopied }: Props) {
  async function handleClick() {
    try {
      await navigator.clipboard.writeText(text);
      onCopied();
    } catch {
      // clipboard denied — do not flip copied
    }
  }

  return (
    <button
      type="button"
      aria-label={copied ? "Copied" : "Copy review"}
      onClick={handleClick}
      className="inline-flex items-center justify-center p-1 text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
    >
      {copied ? (
        // Check icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        // Clipboard icon
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <rect x="9" y="2" width="6" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        </svg>
      )}
    </button>
  );
}
