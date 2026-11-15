import { LegalTabs } from "./LegalTabs";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <LegalTabs />
        {children}
      </main>
    </div>
  );
}
