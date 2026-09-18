import { cookies } from "next/headers";
import { ADMIN_COOKIE } from "@/lib/session-cookie";
import { BusinessList } from "./BusinessList";

type Business = { name: string; tier: string; slug: string };

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value ?? "";

  const res = await fetch(`${process.env.APP_URL}/api/admin/businesses`, {
    headers: { cookie: `${ADMIN_COOKIE}=${token}` },
    cache: "no-store",
  });

  const rows: Business[] = res.ok ? await res.json() : [];

  return (
    <main className="px-4 pt-16">
      <h1 className="text-xl font-semibold">Admin</h1>
      <BusinessList businesses={rows} />
    </main>
  );
}
