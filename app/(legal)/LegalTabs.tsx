"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { label: "Terms of Service", href: "/terms" },
  { label: "Privacy Policy", href: "/privacy" },
] as const;

export function LegalTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Legal pages" className="flex gap-6 border-b border-zinc-200 mb-10">
      {TABS.map(({ label, href }) => (
        <a
          key={href}
          href={href}
          className={cn(
            "pb-3 text-sm font-medium border-b-2 -mb-px transition-colors",
            pathname === href
              ? "border-zinc-900 text-zinc-900"
              : "border-transparent text-zinc-500 hover:text-zinc-900",
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
