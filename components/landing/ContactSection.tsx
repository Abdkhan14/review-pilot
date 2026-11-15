import { CONTACT_EMAIL, CONTACT_PHONE } from "./contact";

export function ContactSection() {
  return (
    <section
      id="contact"
      aria-label="Contact"
      className="py-24 bg-zinc-50 text-center"
    >
      <div className="max-w-5xl mx-auto px-6">
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 mb-4">
          Ready to get started?
        </h2>
        <p className="text-zinc-600 mb-8 max-w-md mx-auto">
          We set up everything for your business. Reach out and we&apos;ll have
          you live within a day.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-zinc-700">
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="underline hover:text-zinc-900 transition-colors"
          >
            {CONTACT_EMAIL}
          </a>
          <a
            href={`tel:${CONTACT_PHONE}`}
            className="underline hover:text-zinc-900 transition-colors"
          >
            {CONTACT_PHONE}
          </a>
        </div>
      </div>
    </section>
  );
}
