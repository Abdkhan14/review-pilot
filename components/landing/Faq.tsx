import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Reveal } from "./Reveal";

const ENTRIES = [
  {
    q: "What is Review Pilot?",
    a: "Review Pilot is a tool for small businesses that turns every happy customer visit into a Google review. A QR code on your counter lets customers pick a pre-written draft and post it to Google in seconds.",
  },
  {
    q: "Is this allowed by Google?",
    a: "Yes. The customer reads the draft, edits it if they like, and posts it themselves. We never post on anyone's behalf. Google's policy requires reviews to reflect the customer's genuine experience — the draft is just a starting point they control.",
  },
  {
    q: "What does the demo do?",
    a: "The Assisted plan shows real AI-drafted reviews with a live Google handoff link. The Basic plan opens your shop's Google review page directly so customers land right on the write-a-review form.",
  },
  {
    q: "What is the difference between Basic and Assisted?",
    a: "Basic gives customers a direct link to your Google review page — they write the review themselves. Assisted provides AI-generated draft reviews in your brand voice so customers only need to tap 'Post'. Assisted is a monthly subscription; Basic is a one-time purchase.",
  },
  {
    q: "How does the free trial work?",
    a: "You get 5 review generations and 2 handoffs at no cost. No credit card required. When you're ready to scale, upgrade to Basic or Assisted.",
  },
  {
    q: "Can I cancel Assisted at any time?",
    a: "Yes. Cancel any time from your account and you won't be charged again. You keep access until the end of the billing period.",
  },
] as const;

export function Faq() {
  return (
    <section id="faq" aria-label="FAQ" className="py-24 bg-white">
      <Reveal className="max-w-2xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-12 text-center">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="flex flex-col gap-1">
          {ENTRIES.map(({ q, a }) => (
            <AccordionItem key={q} value={q} className="border-zinc-200">
              <AccordionTrigger className="text-left text-sm font-medium text-zinc-900 hover:no-underline">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-zinc-600 leading-relaxed">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
