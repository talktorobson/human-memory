import {
  createContext,
  HTMLAttributes,
  PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";
import { clsx } from "clsx";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export interface TabsProps extends PropsWithChildren {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  className,
  children,
}: TabsProps) {
  const [internal, setInternal] = useState(defaultValue);
  const current = value ?? internal;

  const ctx = useMemo<TabsContextValue>(
    () => ({
      value: current,
      setValue: (next) => {
        setInternal(next);
        onValueChange?.(next);
      },
    }),
    [current, onValueChange]
  );

  return <div className={clsx("flex flex-col gap-3", className)}>{<TabsContext.Provider value={ctx}>{children}</TabsContext.Provider>}</div>;
}

export function TabsList({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={clsx("inline-flex items-center gap-1 rounded-md bg-zinc-100 p-1", className)} {...props} />;
}

export interface TabsTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className, children, ...props }: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("TabsTrigger must be used within <Tabs>");
  }
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      className={clsx(
        "rounded px-3 py-1.5 text-sm font-medium transition",
        isActive ? "bg-white text-zinc-900 shadow" : "text-zinc-500 hover:text-zinc-800",
        className
      )}
      onClick={() => ctx.setValue(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className, children, ...props }: TabsContentProps) {
  const ctx = useContext(TabsContext);
  if (!ctx) {
    throw new Error("TabsContent must be used within <Tabs>");
  }
  if (ctx.value !== value) {
    return null;
  }
  return (
    <div className={clsx("mt-1", className)} {...props}>
      {children}
    </div>
  );
}
