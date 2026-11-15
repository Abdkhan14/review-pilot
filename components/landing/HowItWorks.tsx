import { Reveal } from "./Reveal";

const STEPS = [
  {
    step: "1",
    heading: "Print a QR sticker.",
    body: "Put it on the counter, receipt, or table. Customers scan it after their visit.",
  },
  {
    step: "2",
    heading: "They pick a draft.",
    body: "Review Pilot shows three AI-written drafts in their voice. They tap the one that fits.",
  },
  {
    step: "3",
    heading: "They post it on Google.",
    body: "One tap copies the draft. One more tap opens Google Reviews. Done in under 30 seconds.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="px-6 py-20 bg-zinc-900">
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-12 text-center">
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {STEPS.map(({ step, heading, body }, i) => (
            <Reveal key={step} delay={i * 0.1} className="flex flex-col gap-4">
              <span className="text-3xl font-bold text-zinc-600">{step}</span>
              <h3 className="text-xl font-bold text-white">{heading}</h3>
              <p className="text-zinc-400 leading-relaxed">{body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
