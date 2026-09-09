import { Button, IconButton } from "../../../ui/Button";
import { Panel } from "../../../ui/Panel";
import { Icon } from "../../../ui/Icon";
import { cn } from "../../../lib/cn";
import { TextCell } from "./EditableCell";
import type { ViewProps } from "./types";

export function TodoListView({ data, onChange }: ViewProps) {
  const items: any[] = data.items ?? [];

  const update = (next: any[]) => onChange({ ...data, items: next });

  const done = items.filter((item) => item.done).length;

  return (
    <Panel>
      <header className="flex items-center justify-between px-space-lg py-space-base border-b border-outline-variant/30">
        <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
          {done} of {items.length} complete
        </span>
      </header>

      <ul>
        {items.map((item, index) => (
          <li
            key={index}
            className="group flex items-center gap-space-base px-space-lg py-space-sm border-b border-outline-variant/15 hover:bg-surface-container-low/40 transition-colors"
          >
            <button
              onClick={() =>
                update(items.map((row, i) => (i === index ? { ...row, done: !row.done } : row)))
              }
              aria-label={item.done ? "Mark as not done" : "Mark as done"}
              className={cn(
                "w-4 h-4 rounded flex items-center justify-center border transition-colors shrink-0",
                item.done
                  ? "bg-tertiary-container border-tertiary-container text-on-tertiary-container"
                  : "border-outline-variant hover:border-outline",
              )}
            >
              {item.done && <Icon name="check" size={12} />}
            </button>

            <div
              className={cn(
                "flex-1 font-body-md text-body-md min-w-0",
                item.done ? "text-on-surface-variant/40 line-through" : "text-on-surface-variant",
              )}
            >
              <TextCell
                value={item.task ?? ""}
                onChange={(value) =>
                  update(items.map((row, i) => (i === index ? { ...row, task: value } : row)))
                }
              />
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <IconButton
                icon="delete"
                size={14}
                label="Delete task"
                onClick={() => update(items.filter((_, i) => i !== index))}
                className="hover:text-error"
              />
            </div>
          </li>
        ))}
      </ul>

      <div className="px-space-lg py-space-base">
        <Button
          variant="ghost"
          icon="add"
          onClick={() => update([...items, { task: "", done: false }])}
        >
          New task
        </Button>
      </div>
    </Panel>
  );
}
