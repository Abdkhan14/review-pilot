import { Children, cloneElement, forwardRef, isValidElement } from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "outline" | "ghost";
type Size = "sm" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  asChild?: false;
};

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  size?: Size;
  asChild: true;
};

type Props = ButtonProps | AnchorProps;

const base =
  "inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-700",
  outline: "border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900",
  ghost: "bg-transparent hover:bg-zinc-100 text-zinc-900",
};

const sizes: Record<Size, string> = {
  sm: "px-4 py-2 text-sm",
  lg: "h-12 px-6 text-[15px] font-semibold",
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(
  ({ variant = "default", size = "sm", asChild, className = "", children, ...props }, ref) => {
    const cls = cn(base, variants[variant], sizes[size], className);
    if (asChild) {
      const child = Children.only(children);
      if (!isValidElement<{ className?: string }>(child)) {
        throw new Error("Button asChild requires a single React element child");
      }
      return cloneElement(child, {
        ...(props as object),
        className: cn(cls, child.props.className),
      });
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cls}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";
