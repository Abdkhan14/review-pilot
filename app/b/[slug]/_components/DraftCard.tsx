import { StarRow } from "./StarRow";

type Props = { text: string };

export function DraftCard({ text }: Props) {
  return (
    <article className="border border-zinc-200 p-4">
      <StarRow />
      <p className="mt-3 text-sm leading-relaxed">{text}</p>
    </article>
  );
}
