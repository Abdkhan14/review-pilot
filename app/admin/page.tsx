import Link from "next/link";
import { list } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { BusinessList } from "./BusinessList";
import { Button } from "@/components/ui/button";

/** Do not prerender — list() must run against Turso on each request. */
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const rows = await list(db);
  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
        <Button asChild variant="outline">
          <Link href="/admin/businesses/new">+ New business</Link>
        </Button>
      </div>
      <BusinessList businesses={rows} />
    </main>
  );
}
