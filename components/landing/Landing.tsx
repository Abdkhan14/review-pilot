import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { DemoPlaceholder } from "./DemoPlaceholder";
import { HowItWorks } from "./HowItWorks";
import { ContactSection } from "./ContactSection";
import { Footer } from "./Footer";
import { GetStartedButton } from "./GetStartedButton";

type Props = {
  fromQr?: boolean;
  selfServe?: boolean;
};

export function Landing({ fromQr = false, selfServe = false }: Props) {
  void fromQr; // used in later commits
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav contactSlot={<GetStartedButton selfServe={selfServe} />} />
      <main className="flex-1">
        <Hero ctaSlot={<GetStartedButton selfServe={selfServe} />} />
        <DemoPlaceholder />
        <HowItWorks />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
