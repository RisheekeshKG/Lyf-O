import { useRef, useState, type ReactNode } from "react";
import { cn } from "../lib/cn";
import { Icon } from "./Icon";
import { Popover } from "./Popover";

export interface MenuAction {
  label: string;
  icon: string;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface MenuProps {
  actions: MenuAction[];
  trigger?: ReactNode;
  label?: string;
  align?: "left" | "right";
  className?: string;
}

export function Menu({
  actions,
  trigger,
  label = "More actions",
  align = "right",
  className,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const enabled = actions.filter((action) => !action.disabled);

  return (
    <>
      <button
        ref={triggerRef}
        aria-label={label}
        title={label}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          "w-6 h-6 flex items-center justify-center rounded-lg transition-colors",
          open
            ? "bg-surface-container text-on-surface"
            : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
          className,
        )}
      >
        {trigger ?? <Icon name="more_horiz" size={15} />}
      </button>

      {open && (
        <Popover anchorRef={triggerRef} onClose={() => setOpen(false)} align={align} width={200}>
          <div className="py-space-2xs">
            {enabled.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setOpen(false);
                  action.onSelect();
                }}
                className={cn(
                  "w-full flex items-center gap-space-sm px-space-base py-space-xs font-body-sm text-body-sm text-left transition-colors",
                  action.danger
                    ? "text-error hover:bg-error-container/25"
                    : "text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface",
                )}
              >
                <Icon name={action.icon} size={15} />
                {action.label}
              </button>
            ))}
          </div>
        </Popover>
      )}
    </>
  );
}
