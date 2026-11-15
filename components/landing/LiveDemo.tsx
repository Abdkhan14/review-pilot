import { encodeQrSvg } from "@/lib/encode-qr";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Section } from "./Section";
import { Reveal } from "./Reveal";

const DEMO_URL = "https://reviewpilot.app/d/k7Hq2p";
const SAMPLE_BUSINESS = "Joe's Slice House";
const SAMPLE_REVIEW =
  "Came for a slice, stayed for the garlic knots. Crust was thin and crisp — easily the best pizza in the neighbourhood. Will be back every week.";

export async function LiveDemo() {
  const qrSvg = await encodeQrSvg(DEMO_URL);

  return (
    <section id="demo" aria-label="Live demo" className="py-24 bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6">
        <Section
          eyebrow="Live demo"
          heading="See it for yourself"
          lead="This is exactly what your customers see when they scan your QR code."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Static form card */}
          <Reveal>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col gap-4">
              <p className="text-sm font-semibold text-zinc-900">Your business details</p>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">Business name</label>
                <Input defaultValue={SAMPLE_BUSINESS} readOnly tabIndex={-1} />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-zinc-500">What makes you special?</label>
                <Textarea
                  defaultValue="Thin-crust pizza, garlic knots, friendly staff"
                  readOnly
                  tabIndex={-1}
                  rows={3}
                />
              </div>
              <button
                disabled
                className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 opacity-60 cursor-not-allowed"
              >
                Generate drafts
              </button>
            </div>
          </Reveal>

          {/* Sample result card */}
          <Reveal delay={0.1}>
            <div className="rounded-xl border border-zinc-200 bg-white p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-zinc-900">Draft review</p>
                <span className="text-xs text-zinc-400 bg-zinc-100 rounded-full px-2 py-0.5">
                  Sample
                </span>
              </div>
              <p className="text-sm text-zinc-600 leading-relaxed">{SAMPLE_REVIEW}</p>
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 shrink-0"
                  dangerouslySetInnerHTML={{ __html: qrSvg }}
                  aria-label={`QR code for ${SAMPLE_BUSINESS}`}
                />
                <div>
                  <p className="text-xs font-medium text-zinc-900">{SAMPLE_BUSINESS}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Scan to open Google Reviews
                  </p>
                </div>
              </div>
              <button
                disabled
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-200 px-4 text-sm font-medium text-zinc-900 opacity-60 cursor-not-allowed"
              >
                Copy &amp; open Google
              </button>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
