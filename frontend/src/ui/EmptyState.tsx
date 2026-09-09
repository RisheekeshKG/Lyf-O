import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-space-sm py-space-3xl text-center">
      <Icon name={icon} size={32} className="text-on-surface-variant/30" />
      <h3 className="font-headline-sm text-headline-sm text-on-surface">{title}</h3>
      {description && (
        <p className="font-body-sm text-body-sm text-on-surface-variant/60 max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-space-sm">{action}</div>}
    </div>
  );
}
