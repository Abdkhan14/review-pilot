import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth-server";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: string | null;
};

/** The signed-in user for these request headers, or null when signed out. */
export async function getSessionUser(headers: Headers): Promise<SessionUser | null> {
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const { id, name, email, role } = session.user;
  return { id, name, email, role: role ?? null };
}

/** The signed-in user for a page; signed-out visitors go to sign-in and come back to callbackURL. */
export async function requireSignedIn(callbackURL: string): Promise<SessionUser> {
  const user = await getSessionUser(await headers());
  if (!user) redirect(`/sign-in?callbackURL=${encodeURIComponent(callbackURL)}`);
  return user;
}
