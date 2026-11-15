"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactSheet } from "./ContactSheet";

type Props = {
  className?: string;
};

/** Outline "Contact" button — opens the contact sheet without the sign-ups note. */
export function ContactButton({ className }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)} className={className}>
        Contact
      </Button>
      <ContactSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
