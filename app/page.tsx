import Image from "next/image";

export default function Home() {
  return (
    <main>
      {/* Wordmark */}
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-12">
        Review Pilot
      </p>

      {/* Hero */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold tracking-tight leading-tight text-zinc-900 mb-6">
          Google reviews, minus the hard part.
        </h1>
        <p className="text-base text-zinc-500 leading-relaxed">
          A QR on the counter. They pick a draft. They paste it on Google.
        </p>
      </section>

      {/* How it works */}
      <section>
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-8">
          How it works
        </p>
        <div className="overflow-hidden">
          <Image
            src="/how-it-works.jpg"
            alt="Three steps: scan a QR code, pick a review, paste it on Google Reviews."
            width={607}
            height={1024}
            className="w-full h-auto "
            priority
          />
        </div>
      </section>

      {/* Why it matters */}
      <section className="mt-12">
        <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-8">
          Why it matters
        </p>
        <div className="flex flex-col gap-8">
          <div>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
              Most happy customers never review.
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Not because they didn't enjoy it — because writing a review from scratch is effort. A blank text box stops people cold.
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
              A draft changes everything.
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              When the words are already there, customers edit instead of invent. That's a fraction of the friction. More reviews get written.
            </p>
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 mb-2">
              Reviews drive real foot traffic.
            </p>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Google ranks local businesses by recency and volume of reviews. A steady stream beats a burst from three years ago.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
