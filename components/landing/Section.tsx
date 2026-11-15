type Props = {
  eyebrow: string;
  heading: string;
  lead?: string;
};

/** Repeating eyebrow / heading / lead header used by most landing sections. */
export function Section({ eyebrow, heading, lead }: Props) {
  return (
    <>
      <p className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">
        {eyebrow}
      </p>
      <h2 className="text-4xl font-bold tracking-tight leading-[1.15] text-zinc-900 mb-3">
        {heading}
      </h2>
      {lead && (
        <p className="text-base text-zinc-600 leading-relaxed mb-10">{lead}</p>
      )}
    </>
  );
}
