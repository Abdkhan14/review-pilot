import Link from "next/link";
import { AccountMenu } from "./AccountMenu";

type Props = {
  name: string;
  email: string;
};

export function AppHeader({ name, email }: Props) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-[68px] max-w-5xl items-center justify-between gap-6 px-6">
        <nav className="flex h-full items-center gap-6" aria-label="Owner navigation">
          <Link href="/app" className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-900">
            Review Pilot
          </Link>
          <Link
            href="/app"
            aria-current="page"
            className="flex h-full items-center border-b-2 border-zinc-900 text-sm font-semibold text-zinc-900"
          >
            QR codes
          </Link>
        </nav>
        <AccountMenu name={name} email={email} />
      </div>
    </header>
  );
}
