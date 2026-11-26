import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/session";
import { SIGNUPS_CLOSED } from "@/lib/sign-up";
import { safeCallbackUrl } from "./callback-url";
import { SignInCard, type SignInState } from "./SignInCard";

/** Error code the admin plugin uses when a banned user tries to sign in. */
const BANNED_USER = "BANNED_USER";

function stateFromError(error: string | undefined): SignInState {
  if (!error) return "default";
  if (error === SIGNUPS_CLOSED) return "closed";
  if (error === BANNED_USER) return "banned";
  return "failed";
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string; error?: string }>;
}) {
  const { callbackURL, error } = await searchParams;
  const target = safeCallbackUrl(callbackURL);

  if (await getSessionUser(await headers())) redirect(target);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-900">
        Review Pilot
      </p>
      <SignInCard state={stateFromError(error)} callbackURL={target} />
    </main>
  );
}
