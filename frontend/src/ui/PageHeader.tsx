import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface PageHeaderProps {
  icon?: string;
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon, eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-space-3xl">
      {eyebrow && <div className="mb-space-sm flex items-center gap-space-sm">{eyebrow}</div>}
      <div className="flex items-start justify-between gap-space-lg">
        <div className="min-w-0">
          <h1 className="flex items-center gap-space-base font-headline-display text-headline-display text-on-surface">
            {icon && <Icon name={icon} size={28} className="text-primary-container" />}
            {title}
          </h1>
          {description && (
            <p className="mt-space-sm font-body-md text-body-md text-on-surface-variant/70 max-w-3xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex items-center gap-space-sm shrink-0">{actions}</div>}
      </div>
    </header>
  );
}
