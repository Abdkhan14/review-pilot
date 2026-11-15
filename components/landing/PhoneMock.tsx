import { DraftPicker } from "@/components/scan/DraftPicker";

const SAMPLE_DRAFTS = [
  {
    id: "sample-1",
    text: "Been coming here every Friday since I moved to the area. The garlic knots are the reason. Guy at the counter had my order memorized by week two.",
  },
  {
    id: "sample-2",
    text: "Stopped in for a quick lunch and ended up getting a second slice. Get the white pie. Only downside is there's like 4 seats.",
  },
];

export function PhoneMock() {
  return (
    <div className="w-[340px] rounded-[2.75rem] border border-zinc-200 bg-white p-3 shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14),0_0_0_1px_rgba(0,0,0,0.04)]">
      <div className="rounded-[2.25rem] border border-zinc-200 bg-zinc-50 px-5 py-7">
        <p className="pb-5 text-lg font-semibold text-zinc-900">Pick a review to share</p>
        {/* inert — decorative mock, not interactive */}
        <div inert aria-hidden="true">
          <DraftPicker drafts={SAMPLE_DRAFTS} writeReviewUrl="#" />
        </div>
      </div>
    </div>
  );
}
