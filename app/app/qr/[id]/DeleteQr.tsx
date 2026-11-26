"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDeleteQr } from "@/hooks/useDeleteQr";

type Props = {
  id: string;
  name: string;
  /** What deleting loses, beyond the printed sticker, e.g. "Your trial isn't given back." */
  consequence: string;
};

const DANGER_BUTTON = "border-red-200 text-red-700 hover:bg-red-50";

export function DeleteQr({ id, name, consequence }: Props) {
  const router = useRouter();
  const { deleteQr, loading } = useDeleteQr(id);
  const [typed, setTyped] = useState("");
  const confirmed = typed.trim().toLowerCase() === name.trim().toLowerCase();

  async function handleDelete() {
    if (!(await deleteQr())) {
      toast.error("Couldn't delete the QR. Try again.");
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-red-200 bg-white p-6">
      <div>
        <h2 className="text-[17px] font-semibold text-zinc-900">Delete this QR</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Printed stickers will show &ldquo;not found&rdquo;. {consequence}
        </p>
      </div>
      <Dialog onOpenChange={() => setTyped("")}>
        <DialogTrigger asChild>
          <Button variant="outline" size="lg" className={DANGER_BUTTON}>
            Delete QR…
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Delete the {name} QR?</DialogTitle>
          <DialogDescription>
            Printed stickers will show &ldquo;not found&rdquo;. {consequence}
          </DialogDescription>
          <label className="flex flex-col gap-2 text-sm font-medium text-zinc-900">
            Type {name} to confirm
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
          </label>
          <div className="flex justify-end gap-3">
            <DialogClose asChild>
              <Button variant="outline" size="lg">
                Keep it
              </Button>
            </DialogClose>
            <Button
              size="lg"
              className="bg-red-700 hover:bg-red-800"
              disabled={!confirmed || loading}
              onClick={handleDelete}
            >
              Delete QR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
