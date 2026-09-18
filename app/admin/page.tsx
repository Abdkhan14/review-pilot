import { list } from "@/lib/business-repo";
import { db } from "@/lib/db";
import { BusinessList } from "./BusinessList";

export default async function AdminPage() {
  const rows = await list(db);
  return (
    <main className="px-4 pt-16">
      <h1 className="text-xl font-semibold">Admin</h1>
      <BusinessList businesses={rows} />
    </main>
  );
}
