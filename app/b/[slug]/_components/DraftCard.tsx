import { StarRow } from "./StarRow";
import { CopyButton } from "./CopyButton";

type Props = {
  text: string;
  copied?: boolean;
  onCopy?: () => void;
};

export function DraftCard({ text, copied = false, onCopy = () => {} }: Props) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <StarRow />
        <CopyButton text={text} copied={copied} onCopied={onCopy} />
      </div>
      <p className="mt-3 text-sm leading-relaxed">{text}</p>
    </article>
  );
}
