"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactSheet } from "./ContactSheet";

type Props = {
  label?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "lg";
  className?: string;
};

/** Button that opens the contact sheet without the sign-ups note. */
export function ContactButton({
  label = "Contact",
  variant = "outline",
  size = "sm",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} className={className}>
        {label}
      </Button>
      <ContactSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
