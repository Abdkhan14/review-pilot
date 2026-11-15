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
    <nav
      aria-label="Legal pages"
      className="flex gap-1 p-1 rounded-lg bg-zinc-100 w-fit mb-10"
    >
      {TABS.map(({ label, href }) => (
        <a
          key={href}
          href={href}
          className={cn(
            "rounded-md px-4 py-2 text-sm font-medium transition-colors",
            pathname === href
              ? "bg-zinc-900 text-zinc-50 shadow-sm"
              : "text-zinc-600 hover:text-zinc-900",
          )}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
