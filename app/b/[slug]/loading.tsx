function SkeletonCard() {
  return (
    <div className="border-y border-zinc-200 py-4 animate-pulse">
      <div className="h-5 w-24 rounded bg-zinc-200" />
      <div className="mt-3 space-y-2">
        <div className="h-3 w-full rounded bg-zinc-100" />
        <div className="h-3 w-5/6 rounded bg-zinc-100" />
        <div className="h-3 w-4/6 rounded bg-zinc-100" />
      </div>
    </div>
  );
}

export default function Loading() {
  return (
    <main className="mx-auto min-h-dvh w-full max-w-md px-4">
      <h1 className="pt-10 pb-6 text-lg font-semibold">
        Pick a review to share
      </h1>
      <div className="flex flex-col">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </main>
  );
}
