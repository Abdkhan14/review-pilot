import { Section } from "./Section";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    step: "1",
    heading: "You print a QR Code.",
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
    <section id="how-it-works" aria-label="How it works" className="py-24 bg-white">
      <div className="max-w-5xl mx-auto px-6">
        <Section
          eyebrow="How it works"
          heading="Three steps. No Friction."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
          {STEPS.map(({ step, heading, body }, i) => (
            <Reveal key={step} delay={i * 0.1}>
              <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col gap-4 h-full">
                <div className="w-9 h-9 rounded-full bg-zinc-900 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-white">{step}</span>
                </div>
                <h3 className="text-base font-bold text-zinc-900">{heading}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
