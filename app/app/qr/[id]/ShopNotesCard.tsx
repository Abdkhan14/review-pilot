"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateQr } from "@/hooks/useUpdateQr";
import { shortDate } from "@/lib/format";
import { SHOP_NOTES_HELP, SHOP_NOTES_PLACEHOLDER } from "@/lib/shop-notes";
import { Panel } from "./Panel";

const SAVE_FAILED = "Couldn't save. Check your connection and try again.";

type Props = {
  id: string;
  initialNotes: string;
  /** ISO date Google info was last saved, or null if never. */
  detailsFetchedAt: string | null;
};

export function ShopNotesCard({ id, initialNotes, detailsFetchedAt }: Props) {
  const { updateQr, loading } = useUpdateQr(id);
  const [notes, setNotes] = useState(initialNotes);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  const [fetchedAt, setFetchedAt] = useState(detailsFetchedAt);

  async function saveNotes() {
    const result = await updateQr({ customInstructions: notes });
    if (!result) {
      toast.error(SAVE_FAILED);
      return;
    }
    const saved = result.customInstructions ?? "";
    setNotes(saved);
    setSavedNotes(saved);
    toast.success("Shop notes saved");
  }

  async function refreshGoogleInfo() {
    const result = await updateQr({ refreshPlace: true });
    if (!result) {
      toast.error("Couldn't refresh Google info. Try again in a minute.");
      return;
    }
    setFetchedAt(result.detailsFetchedAt);
    toast.success("Google info refreshed");
  }

  return (
    <Panel title="Shop notes">
      <p className="text-sm text-zinc-600">{SHOP_NOTES_HELP}</p>
      <Textarea
        aria-label="Shop notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={8}
        maxLength={4000}
        placeholder={SHOP_NOTES_PLACEHOLDER}
        className="font-mono"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500">
          {fetchedAt ? `Google info saved ${shortDate(new Date(fetchedAt))} · ` : ""}
          <button
            type="button"
            onClick={refreshGoogleInfo}
            disabled={loading}
            className="font-medium text-zinc-900 underline disabled:opacity-50"
          >
            Refresh Google info
          </button>
        </p>
        <Button size="lg" onClick={saveNotes} disabled={loading || notes === savedNotes}>
          Save notes
        </Button>
      </div>
    </Panel>
  );
}
