"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactSheet } from "./ContactSheet";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "lg";

type Props = {
  selfServe: boolean;
  label?: string;
  variant?: Variant;
  size?: Size;
  className?: string;
};

/**
 * Primary call-to-action throughout the landing page.
 *
 * - selfServe=true  → links to /sign-in
 * - selfServe=false → opens the contact sheet with the sign-ups note
 */
export function GetStartedButton({
  selfServe,
  label = "Get started",
  variant = "default",
  size = "sm",
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  if (selfServe) {
    return (
      <Button asChild variant={variant} size={size} className={className}>
        <a href="/sign-in">{label}</a>
      </Button>
    );
  }

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ContactSheet open={open} onClose={() => setOpen(false)} showNote />
    </>
  );
}
