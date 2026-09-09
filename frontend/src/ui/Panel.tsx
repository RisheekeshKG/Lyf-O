import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Icon } from "./Icon";

interface PanelProps {
  children: ReactNode;
  className?: string;
}

/** The bordered container every dashboard section sits in. */
export function Panel({ children, className }: PanelProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-outline-variant/40 bg-surface-container-low/50 overflow-hidden",
        className,
      )}
    >
      {children}
    </section>
  );
}

interface PanelHeaderProps {
  icon?: string;
  title: string;
  count?: string;
  action?: ReactNode;
  className?: string;
}

export function PanelHeader({ icon, title, count, action, className }: PanelHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-center justify-between px-space-xl py-space-lg border-b border-outline-variant/30",
        className,
      )}
    >
      <div className="flex items-center gap-space-sm min-w-0">
        {icon && <Icon name={icon} size={16} className="text-primary shrink-0" />}
        <h2 className="font-headline-sm text-headline-sm text-on-surface truncate">{title}</h2>
        {count && (
          <span className="font-mono-badge text-mono-badge text-on-surface-variant/50 shrink-0">
            {count}
          </span>
        )}
      </div>
      {action}
    </header>
  );
}
