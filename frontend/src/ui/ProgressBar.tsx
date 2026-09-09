import { cn } from "../lib/cn";

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({
  value,
  max = 100,
  className,
  barClassName = "bg-primary-container",
}: ProgressBarProps) {
  const pct = max === 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn("h-1 rounded-full bg-surface-container-highest overflow-hidden", className)}>
      <div className={cn("h-full rounded-full transition-all", barClassName)} style={{ width: `${pct}%` }} />
    </div>
  );
}
