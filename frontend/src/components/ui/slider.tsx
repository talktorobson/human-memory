import { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  min?: number;
  max?: number;
  step?: number;
}

export function Slider({ className, ...props }: SliderProps) {
  return (
    <input
      type="range"
      className={clsx(
        "w-full cursor-pointer appearance-none rounded bg-transparent [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-zinc-900 [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded [&::-webkit-slider-runnable-track]:bg-zinc-200",
        className
      )}
      {...props}
    />
  );
}
