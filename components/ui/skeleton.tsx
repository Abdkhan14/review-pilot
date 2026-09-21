export function Skeleton({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse bg-zinc-200 ${className}`}
      {...props}
    />
  );
}
