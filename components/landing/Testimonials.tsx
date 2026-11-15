const TESTIMONIALS = [
  {
    quote: "Our Google reviews doubled in the first month. Customers love how easy it is.",
    author: "Maria G.",
    role: "Coffee shop owner",
  },
  {
    quote: "Set it up in an afternoon. Now the reviews just come in without me asking.",
    author: "James T.",
    role: "Barbershop owner",
  },
  {
    quote: "The drafts sound like real customers wrote them. No one can tell the difference.",
    author: "Priya S.",
    role: "Boutique owner",
  },
] as const;

export function Testimonials() {
  return (
    <section aria-label="Testimonials" className="py-24 bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-12 text-center">
          What owners say
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {TESTIMONIALS.map(({ quote, author, role }) => (
            <figure key={author} className="flex flex-col gap-4">
              <blockquote className="text-zinc-600 text-sm leading-relaxed">
                &ldquo;{quote}&rdquo;
              </blockquote>
              <figcaption className="text-sm font-medium text-zinc-900">
                {author}
                <span className="block text-zinc-500 font-normal">{role}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
