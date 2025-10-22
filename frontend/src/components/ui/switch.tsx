import { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

export interface SwitchProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={clsx(
        "relative inline-flex h-5 w-9 items-center rounded-full border border-transparent transition",
        checked ? "bg-zinc-900" : "bg-zinc-300",
        className
      )}
      onClick={() => onCheckedChange?.(!checked)}
      {...props}
    >
      <span
        className={clsx(
          "inline-block h-4 w-4 transform rounded-full bg-white transition",
          checked ? "translate-x-4" : "translate-x-1"
        )}
      />
    </button>
  );
}
