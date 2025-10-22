import { PropsWithChildren } from "react";

export function DetailRow({ label, children }: PropsWithChildren<{ label: string }>) {
  return (
    <div className="flex items-start gap-3 py-1">
      <div className="w-28 pt-1 text-xs text-zinc-500">{label}</div>
      <div className="flex-1 text-sm text-zinc-700">{children}</div>
    </div>
  );
}
