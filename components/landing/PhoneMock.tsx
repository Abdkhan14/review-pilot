import { DraftPicker } from "@/components/scan/DraftPicker";

const SAMPLE_DRAFTS = [
  {
    id: "sample-1",
    text: "Came for a slice, stayed for the garlic knots. Crust was thin and crisp, and they remembered my order from last week.",
  },
  {
    id: "sample-2",
    text: "Quick lunch stop that turned into a regular thing. The white pie is the move.",
  },
];

export function PhoneMock() {
  return (
    <div className="w-72 rounded-[2.75rem] border border-zinc-200 bg-white p-3 shadow-2xl shadow-zinc-300/60">
      <div className="rounded-[2.25rem] border border-zinc-200 bg-zinc-50 px-5 py-7">
        <p className="pb-5 text-lg font-semibold text-zinc-900">Pick a review to share</p>
        <DraftPicker drafts={SAMPLE_DRAFTS} writeReviewUrl="#how-it-works" />
      </div>
    </div>
  );
}
