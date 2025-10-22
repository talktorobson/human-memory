export function ScoreBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
      <div className="h-full bg-zinc-800" style={{ width: `${pct}%` }} />
    </div>
  );
}
