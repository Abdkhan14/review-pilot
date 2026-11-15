import { cookies } from "next/headers";
import { isSelfServeEnabled } from "@/lib/flags";
import { Nav } from "@/components/landing/Nav";
import { Footer } from "@/components/landing/Footer";
import { LegalTabs } from "./LegalTabs";

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const selfServe = await isSelfServeEnabled(cookieStore);

  return (
    <div className="min-h-dvh flex flex-col">
      <Nav selfServe={selfServe} />
      <main className="max-w-3xl mx-auto w-full px-6 py-16 flex-1">
        <LegalTabs />
        {children}
      </main>
      <Footer />
    </div>
  );
}
