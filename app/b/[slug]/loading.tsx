function SkeletonCard() {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white px-4 py-4 shadow-sm animate-pulse">
      {/* mirrors DraftCard: StarRow + CopyButton row */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-zinc-200" />
        <div className="h-7 w-7 rounded bg-zinc-200" />
      </div>
      {/* text lines */}
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-zinc-100" />
        <div className="h-3 w-full rounded bg-zinc-100" />
        <div className="h-3 w-5/6 rounded bg-zinc-100" />
        <div className="h-3 w-5/6 rounded bg-zinc-100" />
        <div className="h-3 w-4/6 rounded bg-zinc-100" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main>
      <h1 className="pb-6 text-lg font-semibold">
        Pick a review to share
      </h1>
      <div className="flex flex-col gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
