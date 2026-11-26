import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { getSessionUser } from "@/lib/session";
import { AppHeader } from "@/components/app/AppHeader";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser(await headers());
  if (!user) redirect("/sign-in?callbackURL=/app");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader name={user.name} email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
      <Toaster position="bottom-right" />
    </div>
  );
}
