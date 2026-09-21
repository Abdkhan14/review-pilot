import { DraftsSkeleton } from "./_components/DraftsSkeleton";

export default function Loading() {
  return (
    <main>
      <h1 className="pb-6 text-lg font-semibold">
        Pick a review to share
      </h1>
      <DraftsSkeleton />
    </main>
  );
}
