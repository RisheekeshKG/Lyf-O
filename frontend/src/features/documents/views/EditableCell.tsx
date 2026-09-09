import { useRef, useState } from "react";
import { cn } from "../../../lib/cn";
import { Icon } from "../../../ui/Icon";
import { Popover } from "../../../ui/Popover";
import { formatDate, isOverdue, pillClass } from "./cellStyles";

interface CellProps {
  value: string;
  onChange: (value: string) => void;
}

const CELL_BASE =
  "w-full h-full min-h-row-standard flex items-center px-space-base text-left font-body-md text-body-md";

export function TextCell({ value, onChange }: CellProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className={cn(
          CELL_BASE,
          "truncate transition-colors",
          value ? "text-on-surface" : "text-on-surface-variant/25",
        )}
      >
        {value || "Empty"}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
      onBlur={() => {
        onChange(draft);
        setEditing(false);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(value);
          setEditing(false);
        }
      }}
      className={cn(CELL_BASE, "bg-surface-container-lowest ring-2 ring-primary-container/60 rounded outline-none text-on-surface")}
    />
  );
}

export function NumberCell({ value, onChange }: CellProps) {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className={cn(
          CELL_BASE,
          "justify-end font-mono-code text-mono-code tabular-nums",
          value ? "text-on-surface" : "text-on-surface-variant/25",
        )}
      >
        {value || "—"}
      </button>
    );
  }

  return (
    <input
      autoFocus
      type="number"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(event) => event.key === "Enter" && event.currentTarget.blur()}
      className={cn(CELL_BASE, "justify-end bg-surface-container-lowest ring-2 ring-primary-container/60 rounded outline-none text-on-surface")}
    />
  );
}

export function CheckboxCell({ value, onChange }: CellProps) {
  const checked = value === "true" || value === "yes" || value === "1";

  return (
    <div className={cn(CELL_BASE, "justify-center")}>
      <button
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(checked ? "" : "true")}
        className={cn(
          "w-4 h-4 rounded flex items-center justify-center border transition-colors",
          checked
            ? "bg-tertiary-container border-tertiary-container text-on-tertiary-container"
            : "border-outline-variant/60 text-transparent hover:border-outline",
        )}
      >
        <Icon name="check" size={12} />
      </button>
    </div>
  );
}

export function DateCell({ value, onChange }: CellProps) {
  const [editing, setEditing] = useState(false);
  const overdue = isOverdue(value);

  if (editing) {
    return (
      <input
        autoFocus
        type="date"
        value={value ? value.slice(0, 10) : ""}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => setEditing(false)}
        className={cn(CELL_BASE, "bg-surface-container-lowest ring-2 ring-primary-container/60 rounded outline-none text-on-surface")}
      />
    );
  }

  return (
    <button onClick={() => setEditing(true)} className={cn(CELL_BASE, "gap-space-xs")}>
      {value ? (
        <>
          <Icon
            name="calendar_today"
            size={13}
            className={overdue ? "text-error" : "text-on-surface-variant/40"}
          />
          <span className={overdue ? "text-error" : "text-on-surface"}>{formatDate(value)}</span>
        </>
      ) : (
        <span className="text-on-surface-variant/25">Empty</span>
      )}
    </button>
  );
}

interface OptionCellProps extends CellProps {
  options: string[];
  onAddOption?: (option: string) => void;
}

export function OptionCell({ value, options, onChange, onAddOption }: OptionCellProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);

  const filtered = options.filter((option) =>
    option.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const canCreate =
    query.trim().length > 0 &&
    !options.some((option) => option.toLowerCase() === query.trim().toLowerCase());

  const select = (option: string) => {
    onChange(option);
    setOpen(false);
    setQuery("");
  };

  return (
    <>
      <button
        ref={triggerRef}
        onClick={() => setOpen((current) => !current)}
        className={cn(CELL_BASE, "gap-space-xs")}
      >
        {value ? (
          <span
            className={cn(
              "px-space-sm py-space-2xs rounded-full font-label-sm text-label-sm truncate max-w-full",
              pillClass(value),
            )}
          >
            {value}
          </span>
        ) : (
          <span className="text-on-surface-variant/25">Empty</span>
        )}
      </button>

      {open && (
        <Popover anchorRef={triggerRef} onClose={() => setOpen(false)} width={224}>
          <div className="p-space-xs border-b border-outline-variant/30">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  if (filtered.length > 0) select(filtered[0]);
                  else if (canCreate && onAddOption) {
                    onAddOption(query.trim());
                    select(query.trim());
                  }
                }
                if (event.key === "Escape") setOpen(false);
              }}
              placeholder="Search or create…"
              className="w-full px-space-sm py-space-xs rounded-lg bg-surface-container-lowest font-body-sm text-body-sm text-on-surface outline-none placeholder:text-on-surface-variant/30"
            />
          </div>

          <div className="max-h-56 overflow-y-auto py-space-2xs">
            {value && (
              <button
                onClick={() => select("")}
                className="w-full flex items-center gap-space-sm px-space-base py-space-xs font-body-sm text-body-sm text-on-surface-variant/60 hover:bg-surface-container-highest transition-colors"
              >
                <Icon name="close" size={14} />
                Clear
              </button>
            )}

            {filtered.map((option) => (
              <button
                key={option}
                onClick={() => select(option)}
                className="w-full flex items-center gap-space-sm px-space-base py-space-xs hover:bg-surface-container-highest transition-colors"
              >
                <span
                  className={cn(
                    "px-space-sm py-space-2xs rounded-full font-label-sm text-label-sm",
                    pillClass(option),
                  )}
                >
                  {option}
                </span>
                {option === value && (
                  <Icon name="check" size={14} className="ml-auto text-primary" />
                )}
              </button>
            ))}

            {canCreate && onAddOption && (
              <button
                onClick={() => {
                  onAddOption(query.trim());
                  select(query.trim());
                }}
                className="w-full flex items-center gap-space-sm px-space-base py-space-xs font-body-sm text-body-sm text-on-surface-variant hover:bg-surface-container-highest transition-colors"
              >
                <Icon name="add" size={14} />
                Create “{query.trim()}”
              </button>
            )}

            {filtered.length === 0 && !canCreate && (
              <p className="px-space-base py-space-sm font-body-sm text-body-sm text-on-surface-variant/40">
                No options
              </p>
            )}
          </div>
        </Popover>
      )}
    </>
  );
}
