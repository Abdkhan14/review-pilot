import { GenerateProgress } from "./_components/DraftsSkeleton";

export default function Loading() {
  return (
    <main>
      <h1 className="pb-6 text-lg font-semibold">Pick a review to share</h1>
      {/* Frozen at step 1 — the timer starts once ScanDrafts mounts client-side. */}
      <GenerateProgress activeIndex={0} progressPct={0} />
    </main>
  );
}
