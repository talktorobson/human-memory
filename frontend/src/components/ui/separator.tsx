import { HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Separator({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("h-px w-full bg-zinc-200", className)} {...props} />;
}
