import { tokens } from "@/app/tokens";

// Demo layout: same narrow column as /b/ but without top padding — the
// DemoBar component sits flush at the top inside the column border.
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`mx-auto min-h-dvh w-full ${tokens.maxWidth} border-x ${tokens.border} ${tokens.background} ${tokens.text}`}>
      {children}
    </div>
  );
}
