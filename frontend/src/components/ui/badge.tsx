import { HTMLAttributes } from "react";
import { clsx } from "clsx";

type Variant = "default" | "secondary" | "outline";

const base = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium";

const variants: Record<Variant, string> = {
  default: "border-transparent bg-zinc-900 text-white",
  secondary: "border-transparent bg-zinc-100 text-zinc-700",
  outline: "border-zinc-300 text-zinc-600",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: Variant;
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return <span className={clsx(base, variants[variant], className)} {...props} />;
}
