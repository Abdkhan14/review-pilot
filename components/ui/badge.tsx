type Variant = "default" | "outline" | "success";

type Props = React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant };

const variants: Record<Variant, string> = {
  default: "bg-zinc-900 text-zinc-50",
  outline: "border border-zinc-300 text-zinc-400",
  success: "border border-green-500 text-green-600",
};

export function Badge({ variant = "outline", className = "", children, ...props }: Props) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
