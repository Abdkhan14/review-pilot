import Link from "next/link";

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

type Props = {
  /** Slot for the Contact button — provided by the parent once a sheet is wired. */
  contactSlot?: React.ReactNode;
};

export function Nav({ contactSlot }: Props) {
  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
      <Link href="/" className="text-sm font-semibold tracking-widest uppercase text-zinc-900">
        Review Pilot
      </Link>
      <div className="flex items-center gap-6">
        <ul className="hidden sm:flex items-center gap-6 list-none m-0 p-0">
          {NAV_LINKS.map(({ label, href }) => (
            <li key={href}>
              <a href={href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
                {label}
              </a>
            </li>
          ))}
        </ul>
        {contactSlot}
      </div>
    </nav>
  );
}
