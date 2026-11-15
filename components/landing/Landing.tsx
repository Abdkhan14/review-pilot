import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { DemoPlaceholder } from "./DemoPlaceholder";
import { HowItWorks } from "./HowItWorks";
import { Pricing } from "./Pricing";
import { Testimonials } from "./Testimonials";
import { Faq } from "./Faq";
import { ContactSection } from "./ContactSection";
import { Footer } from "./Footer";
import { GetStartedButton } from "./GetStartedButton";
import { OwnerBanner } from "./OwnerBanner";

type Props = {
  fromQr?: boolean;
  selfServe?: boolean;
};

export function Landing({ fromQr = false, selfServe = false }: Props) {
  return (
    <div className="min-h-dvh flex flex-col">
      {fromQr && <OwnerBanner />}
      <Nav contactSlot={<GetStartedButton selfServe={selfServe} />} />
      <main className="flex-1">
        <Hero ctaSlot={<GetStartedButton selfServe={selfServe} />} />
        <DemoPlaceholder />
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
