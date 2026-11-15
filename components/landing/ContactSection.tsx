import { CONTACT_EMAIL, WHATSAPP_URL } from "./contact";
import { Reveal } from "./Reveal";

export function ContactSection() {
  return (
    <section id="contact" aria-label="Contact" className="py-24 bg-white">
      <Reveal className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          <div>
            <p className="text-xs font-semibold tracking-[0.18em] uppercase text-zinc-500 mb-3">
              Contact
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-2">
              Rather talk to a person?
            </h2>
            <p className="text-zinc-500 text-sm max-w-sm">
              We set up everything for you. Reach out and you&apos;ll be live
              within a day.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex h-11 items-center justify-center rounded-md border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900 text-sm font-medium px-6 transition-colors"
            >
              Email us
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center justify-center rounded-md bg-zinc-900 hover:bg-zinc-700 text-zinc-50 text-sm font-medium px-6 transition-colors"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
