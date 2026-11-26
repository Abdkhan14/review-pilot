import { cn } from "@/lib/utils";

type Props = {
  title?: string;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
};

export function Panel({ title, aside, className, children }: Props) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-6", className)}>
      {(title || aside) && (
        <div className="flex items-center justify-between gap-3">
          {title && <h2 className="text-[17px] font-semibold text-zinc-900">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}
