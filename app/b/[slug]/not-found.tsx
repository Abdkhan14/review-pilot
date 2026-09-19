import { tokens } from "@/app/tokens";

export default function NotFound() {
  return (
    <main className={`px-4 pt-16 ${tokens.text}`}>
      <h1 className="text-xl font-semibold">Business not found</h1>
      <p className="mt-2 text-sm">
        We couldn&apos;t find this business. The link may be incorrect or the
        business may no longer be available.
      </p>
    </main>
  );
}
