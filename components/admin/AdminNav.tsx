"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Businesses", exact: true },
  { href: "/admin/demos", label: "Demos", exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  if (pathname === "/admin/login") return null;

  return (
    <nav className="border-b border-zinc-200 flex gap-1 items-start mb-6 -mx-4 px-4" aria-label="Admin navigation">
      {NAV_ITEMS.map(({ href, label, exact }) => {
        const isActive = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "px-2.5 py-2.5 text-sm whitespace-nowrap",
              isActive
                ? "font-semibold text-zinc-900 border-b-2 border-zinc-900"
                : "font-normal text-zinc-600 hover:text-zinc-900",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
