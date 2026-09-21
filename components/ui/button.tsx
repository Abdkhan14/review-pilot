import { forwardRef } from "react";

type Variant = "default" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  asChild?: false;
};

type AnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  variant?: Variant;
  asChild: true;
};

type Props = ButtonProps | AnchorProps;

const base =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none px-4 py-2";

const variants: Record<Variant, string> = {
  default: "bg-zinc-900 text-zinc-50 hover:bg-zinc-700",
  outline: "border border-zinc-200 bg-transparent hover:bg-zinc-50 text-zinc-900",
  ghost: "bg-transparent hover:bg-zinc-100 text-zinc-900",
};

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(
  ({ variant = "default", asChild, className = "", ...props }, ref) => {
    const cls = `${base} ${variants[variant]} ${className}`;
    if (asChild) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          className={cls}
          {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}
        />
      );
    }
    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={cls}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      />
    );
  }
);
Button.displayName = "Button";
