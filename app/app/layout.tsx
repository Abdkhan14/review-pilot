import { Toaster } from "sonner";
import { requireSignedIn } from "@/lib/session";
import { AppHeader } from "@/components/app/AppHeader";

export default async function OwnerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSignedIn("/app");

  return (
    <div className="flex min-h-dvh flex-col">
      <AppHeader name={user.name} email={user.email} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">{children}</main>
      <Toaster position="bottom-right" />
    </div>
  );
}
