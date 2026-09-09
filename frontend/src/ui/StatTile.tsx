import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface StatTileProps {
  label: string;
  value: string;
  detail?: string;
  icon?: string;
  iconClassName?: string;
  accessory?: ReactNode;
}

export function StatTile({
  label,
  value,
  detail,
  icon,
  iconClassName = "text-on-surface-variant/40",
  accessory,
}: StatTileProps) {
  return (
    <div className="flex items-center justify-between gap-space-base px-space-xl py-space-lg rounded-xl border border-outline-variant/40 bg-surface-container-low/50">
      <div className="min-w-0">
        <div className="font-mono-badge text-mono-badge text-on-surface-variant/50 uppercase tracking-wider">
          {label}
        </div>
        <div className="mt-space-xs font-headline-md text-headline-md text-on-surface truncate">
          {value}
        </div>
        {detail && (
          <div className="font-label-sm text-label-sm text-on-surface-variant/70 truncate">
            {detail}
          </div>
        )}
      </div>
      {accessory ?? (icon && <Icon name={icon} size={22} className={iconClassName} />)}
    </div>
  );
}
