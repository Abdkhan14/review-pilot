import { layoutClass } from "@/app/tokens";
import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={layoutClass.column}>
      <AdminNav />
      {children}
    </div>
  );
}
