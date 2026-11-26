"use client";

import { useState, Suspense } from "react";
import { DemoBar } from "./DemoBar";
import { ScanDrafts, anotherSetLabel } from "@/components/scan/ScanDrafts";

type Props = {
  demoId: string;
  shopName: string;
  initialTriesLeft: number;
  writeReviewUrl: string;
};

export function DemoScan({ demoId, shopName, initialTriesLeft, writeReviewUrl }: Props) {
  const [triesLeft, setTriesLeft] = useState(initialTriesLeft);

  return (
    <div className="flex flex-col">
      <Suspense>
        <DemoBar shopName={shopName} triesLeft={triesLeft} demoId={demoId} />
      </Suspense>
      <div className="px-4 py-10">
        <h1 className="pb-6 text-lg font-semibold">Pick a review to share</h1>
        <ScanDrafts
          apiBase={`/api/d/${demoId}/generate`}
          writeReviewUrl={writeReviewUrl}
          onGenerated={({ triesLeft: left }) => {
            if (left !== undefined) setTriesLeft(left);
          }}
          anotherSetLabel={anotherSetLabel(triesLeft)}
        />
      </div>
    </div>
  );
}
