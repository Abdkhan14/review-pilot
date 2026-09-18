import Link from "next/link";
import { list } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { BusinessList } from "./BusinessList";

export default async function AdminPage() {
  const rows = await list(db);
  return (
    <main className="px-4 pt-16">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Admin</h1>
        <Link
          href="/admin/businesses/new"
          className="border border-zinc-200 px-3 py-1 text-sm"
        >
          New business
        </Link>
      </div>
      <BusinessList businesses={rows} />
    </main>
  );
}
