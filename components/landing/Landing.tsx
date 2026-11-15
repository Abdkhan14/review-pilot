import { Nav } from "./Nav";
import { Hero } from "./Hero";
import { DemoPlaceholder } from "./DemoPlaceholder";
import { HowItWorks } from "./HowItWorks";
import { Footer } from "./Footer";

type Props = {
  fromQr?: boolean;
  selfServe?: boolean;
};

export function Landing({ fromQr = false, selfServe = false }: Props) {
  void fromQr; // used in later commits
  void selfServe; // used in later commits
  return (
    <div className="min-h-dvh flex flex-col">
      <Nav />
      <main className="flex-1">
        <DemoPlaceholder />
        <Hero />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
