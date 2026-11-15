import { Section } from "./Section";
import { Reveal } from "./Reveal";

const TESTIMONIALS = [
  {
    quote:
      "Regulars always said they'd leave us a review and then forgot. Now they scan the sign by the register while their drink's being made. We had 38 reviews in March and we're past 100 now.",
    author: "Maria G.",
    role: "Coffee shop owner",
  },
  {
    quote:
      "I'm not a tech person and I had it running before my first client walked in. Guys do it in the chair while I'm sweeping up.",
    author: "James T.",
    role: "Barbershop owner",
  },
  {
    quote:
      "People wanted to help but never knew what to write. Now they pick a draft, change a word or two, and post it. I got more reviews last month than in all of last year.",
    author: "Priya S.",
    role: "Boutique owner",
  },
  {
    quote:
      "I downloaded the QR the day I signed up and taped it to the window. When the rain wrecked it, I just printed another one. No waiting two weeks on a sticker order.",
    author: "Dev R.",
    role: "Food truck owner",
  },
] as const;

export function Testimonials() {
  return (
    <section aria-label="Testimonials" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <Section eyebrow="Testimonials" heading="What owners say" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-10">
          {TESTIMONIALS.map(({ quote, author, role }, i) => (
            <Reveal key={author} delay={(i % 2) * 0.1}>
              <figure className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col gap-4 h-full">
                <blockquote className="text-zinc-600 text-sm leading-relaxed flex-1">
                  &ldquo;{quote}&rdquo;
                </blockquote>
                <figcaption className="text-sm font-semibold text-zinc-900">
                  {author}
                  <span className="block text-zinc-500 font-normal">{role}</span>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
