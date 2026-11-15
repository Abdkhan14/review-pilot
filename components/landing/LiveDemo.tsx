import { Section } from "./Section";
import { Reveal } from "./Reveal";
import { DemoWidget } from "./demo/DemoWidget";

export function LiveDemo() {
  return (
    <section id="demo" aria-label="Live demo" className="py-24 bg-zinc-50">
      <div className="max-w-5xl mx-auto px-6">
        <Section
          eyebrow="Live demo"
          heading="See it for yourself"
          lead="This is exactly what your customers see when they scan your QR code."
        />

        <Reveal>
          <DemoWidget />
        </Reveal>
      </div>
    </section>
  );
}
