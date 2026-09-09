import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";

interface SidebarSectionProps {
  title: string;
  onAdd?: () => void;
  addLabel?: string;
  children: ReactNode;
}

export function SidebarSection({ title, onAdd, addLabel, children }: SidebarSectionProps) {
  return (
    <div className="mb-space-lg">
      <div className="flex items-center justify-between px-space-base py-space-xs mb-space-xs group">
        <span className="font-mono-badge text-mono-badge text-on-surface-variant/50 tracking-wider font-semibold uppercase">
          {title}
        </span>
        {onAdd && (
          <button
            onClick={onAdd}
            aria-label={addLabel ?? `Add to ${title}`}
            title={addLabel ?? `Add to ${title}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-on-surface"
          >
            <Icon name="add" size={14} />
          </button>
        )}
      </div>
      <nav className="flex flex-col gap-space-2xs">{children}</nav>
    </div>
  );
}
