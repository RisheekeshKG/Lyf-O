import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import { Icon } from "../ui/Icon";

interface SidebarNavLinkProps {
  to: string;
  icon: string;
  label: string;
  badge?: string;
  badgeTone?: "tertiary" | "secondary";
  iconClassName?: string;
  end?: boolean;
}

export function SidebarNavLink({
  to,
  icon,
  label,
  badge,
  badgeTone = "tertiary",
  iconClassName,
  end,
}: SidebarNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-space-base px-space-base py-space-sm rounded-lg transition-colors",
          isActive
            ? "bg-surface-container text-on-surface"
            : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
        )
      }
    >
      <Icon name={icon} size={16} className={iconClassName} />
      <span className="font-body-sm text-body-sm flex-1 truncate">{label}</span>
      {badge && (
        <span
          className={cn(
            "px-space-xs py-space-2xs rounded font-mono-badge text-mono-badge",
            badgeTone === "tertiary"
              ? "bg-tertiary-container text-on-tertiary-container"
              : "bg-secondary-container text-on-secondary-container",
          )}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}
