import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { LiveDemo } from "./LiveDemo";
import { HowItWorks } from "./HowItWorks";
import { Pricing } from "./Pricing";
import { Testimonials } from "./Testimonials";
import { Faq } from "./Faq";
import { ContactSection } from "./ContactSection";
import { Footer } from "./Footer";
import { OwnerBanner } from "./OwnerBanner";
import { SmoothScroll } from "./SmoothScroll";

type Props = {
  fromQr?: boolean;
  selfServe?: boolean;
};

export function Landing({ fromQr = false, selfServe = false }: Props) {
  return (
    <div className="min-h-dvh flex flex-col">
      <SmoothScroll />
      {fromQr && <OwnerBanner />}
      <Nav selfServe={selfServe} />
      <main className="flex-1">
        <Hero selfServe={selfServe} />
        <LiveDemo />
        <HowItWorks />
        <Pricing selfServe={selfServe} />
        <Testimonials />
        <Faq />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
