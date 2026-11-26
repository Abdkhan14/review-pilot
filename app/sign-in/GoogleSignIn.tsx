"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type Props = {
  callbackURL: string;
  /** Show the failure alert on first render, e.g. after Google sent the user back with an error. */
  failed?: boolean;
};

export function GoogleSignIn({ callbackURL, failed: initialFailed = false }: Props) {
  const [opening, setOpening] = useState(false);
  const [failed, setFailed] = useState(initialFailed);

  async function signIn() {
    setOpening(true);
    setFailed(false);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL: `/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`,
    });
    if (error) {
      setOpening(false);
      setFailed(true);
    }
  }

  return (
    <>
      {failed && (
        <Alert variant="destructive">Google sign-in didn&apos;t finish. Try again.</Alert>
      )}
      <Button variant="outline" size="lg" className="w-full gap-2.5" disabled={opening} onClick={signIn}>
        {opening ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Opening Google…
          </>
        ) : (
          <>
            <span
              aria-hidden
              className="flex size-5 items-center justify-center rounded-full border border-zinc-900 text-[11px] font-bold"
            >
              G
            </span>
            Continue with Google
          </>
        )}
      </Button>
    </>
  );
}
