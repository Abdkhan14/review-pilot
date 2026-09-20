import Image from "next/image";
import { Instrument_Sans } from "next/font/google";

const font = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export default function Home() {
  return (
    <main className={`${font.className} py-16 px-1`}>
      {/* Wordmark */}
      <p className="text-xs font-semibold tracking-widest uppercase text-zinc-400 mb-12">
        Review Pilot
      </p>

      {/* Hero */}
      <section className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight leading-tight text-zinc-900 mb-6">
          Google reviews without the awkward ask.
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
            className="w-full h-auto -mt-8"
            priority
          />
        </div>
      </section>
    </main>
  );
}
