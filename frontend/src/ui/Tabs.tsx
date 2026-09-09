import { cn } from "../lib/cn";

export interface TabItem<T extends string> {
  id: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  className?: string;
}

export function Tabs<T extends string>({ tabs, active, onChange, className }: TabsProps<T>) {
  return (
    <div
      className={cn(
        "flex items-center gap-space-xs border-b border-outline-variant/30",
        className,
      )}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-space-xs px-space-base py-space-sm font-label-md text-label-md transition-colors -mb-px border-b-2",
              isActive
                ? "border-primary-container text-on-surface"
                : "border-transparent text-on-surface-variant/60 hover:text-on-surface",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  "px-space-xs rounded font-mono-badge text-mono-badge",
                  isActive
                    ? "bg-primary-container text-on-primary"
                    : "bg-surface-container-high text-on-surface-variant/70",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
