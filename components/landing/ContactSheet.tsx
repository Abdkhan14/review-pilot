"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CONTACT_EMAIL, CONTACT_PHONE } from "./contact";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ContactSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="right" className="max-w-sm">
        <SheetHeader>
          <SheetTitle>Get in touch</SheetTitle>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-6 text-sm text-zinc-700">
          <p className="text-zinc-500">
            Interested in Review Pilot for your business? Reach out and we&apos;ll
            get back to you shortly.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="underline hover:text-zinc-900 transition-colors"
            >
              {CONTACT_EMAIL}
            </a>
            <a
              href={`tel:${CONTACT_PHONE}`}
              className="underline hover:text-zinc-900 transition-colors"
            >
              {CONTACT_PHONE}
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
