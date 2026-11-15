"use client";

import { useState } from "react";
import { Section } from "./Section";
import { Reveal } from "./Reveal";

const FAQS = [
  {
    q: "Does Review Pilot write the reviews for me?",
    a: "No — and that's by design. Review Pilot generates a few short draft starting points. The customer reads them, picks one, edits it however they like, then posts it themselves. The review is always theirs.",
  },
  {
    q: "Will Google penalise me for this?",
    a: "No. Google's policies prohibit businesses from posting reviews on behalf of customers or offering incentives. Review Pilot doesn't do either. The customer sees the draft, decides whether it reflects their experience, and posts it under their own Google account.",
  },
  {
    q: "Are these from bot accounts?",
    a: "No. Each review is posted by the actual customer scanning your QR code, from their own Google account. Review Pilot only provides draft text — it has no access to any Google account and cannot post on anyone's behalf.",
  },
  {
    q: "How long does setup take?",
    a: "Under five minutes. You sign in, name your business, and your QR is ready to download. Print it and you're live.",
  },
  {
    q: "What if I want to change the QR later?",
    a: "The QR code links to a permanent URL for your place. You can update your business name and details any time — the QR code stays the same.",
  },
  {
    q: "Do I need to install anything?",
    a: "Nothing. Customers scan with their phone's camera. No app download, no account required on their side.",
  },
  {
    q: "Can I use this for multiple locations?",
    a: "Yes. Each location gets its own QR code and its own dashboard. Manage them all from one account.",
  },
] as const;

export function Faq() {
  const [open, setOpen] = useState<number>(-1);

  return (
    <section id="faq" aria-label="FAQ" className="py-24 bg-zinc-50">
      <div className="max-w-2xl mx-auto px-6">
        <Section
          eyebrow="FAQ"
          heading="Questions owners ask"
        />
        <Reveal>
          <dl className="mt-10 flex flex-col gap-2">
            {FAQS.map(({ q, a }, i) => (
              <div key={q} className="rounded-xl border border-zinc-200 overflow-hidden">
                <dt>
                  <button
                    className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-zinc-900 hover:bg-zinc-50 transition-colors text-left"
                    aria-expanded={open === i}
                    onClick={() => setOpen(open === i ? -1 : i)}
                  >
                    {q}
                    <span
                      className={`ml-4 shrink-0 text-zinc-400 transition-transform ${
                        open === i ? "rotate-180" : ""
                      }`}
                      aria-hidden="true"
                    >
                      ▾
                    </span>
                  </button>
                </dt>
                {open === i && (
                  <dd className="px-5 pb-5 text-sm text-zinc-600 leading-relaxed border-t border-zinc-100 pt-4">
                    {a}
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}
