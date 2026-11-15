"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContactSheet } from "./ContactSheet";

type Props = {
  /** When true, clicking navigates to /sign-in. When false, opens the contact sheet. */
  selfServe: boolean;
  className?: string;
};

export function GetStartedButton({ selfServe, className }: Props) {
  const [sheetOpen, setSheetOpen] = useState(false);

  if (selfServe) {
    return (
      <Button asChild className={className}>
        <a href="/sign-in">Get started</a>
      </Button>
    );
  }

  return (
    <>
      <Button onClick={() => setSheetOpen(true)} className={className}>
        Get started
      </Button>
      <ContactSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </>
  );
}
