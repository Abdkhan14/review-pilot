export function Card({
  className = "",
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`border border-zinc-200 bg-white p-4 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
