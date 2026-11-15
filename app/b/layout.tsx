import { layoutClass } from "@/app/tokens";

export default function ScanLayout({ children }: { children: React.ReactNode }) {
  return <div className={layoutClass.column}>{children}</div>;
}
