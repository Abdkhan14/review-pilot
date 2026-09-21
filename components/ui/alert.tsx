type Variant = "default" | "destructive";

type Props = React.HTMLAttributes<HTMLDivElement> & { variant?: Variant };

const variants: Record<Variant, string> = {
  default: "border border-zinc-200 bg-zinc-50 text-zinc-900",
  destructive: "border border-red-200 bg-red-50 text-red-700",
};

export function Alert({ variant = "default", className = "", children, ...props }: Props) {
  return (
    <div
      role="alert"
      className={`px-4 py-3 text-sm ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
