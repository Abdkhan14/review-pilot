import Link from "next/link";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ContactButton } from "@/components/landing/ContactButton";
import { GoogleSignIn } from "./GoogleSignIn";

export type SignInState = "default" | "closed" | "banned" | "failed";

type Props = {
  state: SignInState;
  callbackURL: string;
};

const TITLES: Record<SignInState, string> = {
  default: "Sign in",
  failed: "Sign in",
  closed: "Sign-ups open soon",
  banned: "This account is blocked",
};

export function SignInCard({ state, callbackURL }: Props) {
  return (
    <section className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-7">
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{TITLES[state]}</h1>
      {state === "closed" && <SignUpsClosed />}
      {state === "banned" && <Banned />}
      {(state === "default" || state === "failed") && (
        <>
          {state === "default" && (
            <p className="text-sm leading-relaxed text-zinc-600">
              New here? This creates your account. Use the Google account you manage your
              Business Profile with.
            </p>
          )}
          <GoogleSignIn callbackURL={callbackURL} failed={state === "failed"} />
          <p className="text-xs leading-relaxed text-zinc-500">
            By continuing you agree to the{" "}
            <Link href="/terms" className="underline hover:text-zinc-900">Terms</Link> and{" "}
            <Link href="/privacy" className="underline hover:text-zinc-900">Privacy Policy</Link>.
          </p>
        </>
      )}
    </section>
  );
}

function SignUpsClosed() {
  return (
    <>
      <p className="text-sm leading-relaxed text-zinc-600">
        We&apos;re not creating new accounts yet. Message us and we&apos;ll set up your QR by hand
        in the meantime.
      </p>
      <ContactButton label="Contact us" variant="default" size="lg" className="w-full" />
      <Button asChild variant="ghost" className="w-full">
        <Link href="/">Back to home</Link>
      </Button>
    </>
  );
}

function Banned() {
  return (
    <>
      <Alert variant="destructive">This account can&apos;t sign in right now.</Alert>
      <p className="text-sm text-zinc-600">If you think this is a mistake, get in touch.</p>
      <ContactButton label="Contact us" size="lg" className="w-full" />
    </>
  );
}
