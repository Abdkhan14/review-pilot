import { layoutClass } from "@/app/tokens";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className={layoutClass.column}>{children}</div>;
}
