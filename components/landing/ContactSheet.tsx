"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CONTACT_EMAIL, CONTACT_PHONE_DISPLAY, CONTACT_PHONE, WHATSAPP_URL } from "./contact";

type Props = {
  open: boolean;
  onClose: () => void;
  /** When true, shows an amber notice that sign-ups are currently closed. */
  showNote?: boolean;
};

export function ContactSheet({ open, onClose, showNote = false }: Props) {
  const [copied, setCopied] = useState(false);

  function copyEmail() {
    navigator.clipboard.writeText(CONTACT_EMAIL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent side="right" className="w-[400px] max-w-full">
        <SheetHeader>
          <SheetTitle>Get in touch</SheetTitle>
        </SheetHeader>

        {showNote && (
          <p className="mt-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
            Sign-ups aren&apos;t open yet — reach out and we&apos;ll get you set up directly.
          </p>
        )}

        <div className="mt-6 flex flex-col gap-4">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-xs text-zinc-500 mb-1">Email</p>
            <p className="text-sm font-medium text-zinc-900 break-all">{CONTACT_EMAIL}</p>
          </div>

          <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
            <p className="text-xs text-zinc-500 mb-1">Phone</p>
            <p className="text-sm font-medium text-zinc-900">{CONTACT_PHONE_DISPLAY}</p>
          </div>

          <div className="flex gap-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex-1 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900 text-sm font-medium h-10 px-4 transition-colors"
            >
              Email
            </a>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="flex-1 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900 text-sm font-medium h-10 px-4 transition-colors"
            >
              WhatsApp
            </a>
            <button
              onClick={copyEmail}
              className="flex-1 inline-flex items-center justify-center rounded-md border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900 text-sm font-medium h-10 px-4 transition-colors"
            >
              {copied ? "Copied!" : "Copy email"}
            </button>
          </div>

          <a
            href={`tel:${CONTACT_PHONE}`}
            className="text-xs text-zinc-500 hover:text-zinc-900 transition-colors text-center"
          >
            {CONTACT_PHONE_DISPLAY}
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
