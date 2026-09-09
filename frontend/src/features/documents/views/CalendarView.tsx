import { useMemo, useState } from "react";
import { Panel } from "../../../ui/Panel";
import { Icon } from "../../../ui/Icon";
import { Button, IconButton } from "../../../ui/Button";
import { Menu } from "../../../ui/Menu";
import { cn } from "../../../lib/cn";
import type { ViewProps } from "./types";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const toKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;

/** Monday-first grid covering the whole month plus padding days. */
function buildGrid(cursor: Date): Date[] {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return day;
  });
}

export function CalendarView({ data, onChange }: ViewProps) {
  const events: any[] = data.events ?? [];
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string>(() => toKey(new Date()));

  const grid = useMemo(() => buildGrid(cursor), [cursor]);

  const byDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const event of events) {
      const key = String(event.date ?? "").slice(0, 10);
      if (!key) continue;
      map.set(key, [...(map.get(key) ?? []), event]);
    }
    return map;
  }, [events]);

  const writeEvents = (next: any[]) => onChange({ ...data, events: next });

  const addEvent = (dateKey: string) =>
    writeEvents([
      ...events,
      { id: Date.now(), title: "New event", date: dateKey, description: "" },
    ]);

  const updateEvent = (id: any, patch: any) =>
    writeEvents(events.map((event) => (event.id === id ? { ...event, ...patch } : event)));

  const deleteEvent = (id: any) => writeEvents(events.filter((event) => event.id !== id));

  const shiftMonth = (delta: number) =>
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1));

  const todayKey = toKey(new Date());
  const selectedEvents = byDate.get(selected) ?? [];

  return (
    <div className="grid gap-space-xl xl:grid-cols-[1.7fr_1fr] items-start">
      <Panel>
        <header className="flex items-center justify-between px-space-lg py-space-base border-b border-outline-variant/30">
          <h2 className="font-headline-md text-headline-md text-on-surface">
            {cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </h2>
          <div className="flex items-center gap-space-xs">
            <IconButton icon="chevron_left" label="Previous month" onClick={() => shiftMonth(-1)} />
            <Button variant="ghost" onClick={() => setCursor(new Date())}>
              Today
            </Button>
            <IconButton icon="chevron_right" label="Next month" onClick={() => shiftMonth(1)} />
          </div>
        </header>

        <div className="grid grid-cols-7 border-b border-outline-variant/20">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="px-space-sm py-space-xs text-center font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/40"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {grid.map((day) => {
            const key = toKey(day);
            const dayEvents = byDate.get(key) ?? [];
            const isCurrentMonth = day.getMonth() === cursor.getMonth();

            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                className={cn(
                  "min-h-20 flex flex-col gap-space-2xs items-start p-space-sm border-b border-r border-outline-variant/15 text-left transition-colors",
                  selected === key ? "bg-surface-container" : "hover:bg-surface-container-low/50",
                  !isCurrentMonth && "opacity-35",
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 flex items-center justify-center rounded-full font-label-sm text-label-sm",
                    key === todayKey
                      ? "bg-primary-container text-on-primary"
                      : "text-on-surface-variant",
                  )}
                >
                  {day.getDate()}
                </span>

                {dayEvents.slice(0, 2).map((event, index) => (
                  <span
                    key={index}
                    className="w-full truncate px-space-2xs rounded bg-secondary-container/40 font-mono-badge text-mono-badge text-on-secondary-container"
                  >
                    {event.title}
                  </span>
                ))}

                {dayEvents.length > 2 && (
                  <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
                    +{dayEvents.length - 2} more
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Panel>

      <Panel>
        <header className="flex items-center justify-between px-space-lg py-space-base border-b border-outline-variant/30">
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface">
              {new Date(`${selected}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>
            <p className="font-mono-badge text-mono-badge text-on-surface-variant/40">
              {selectedEvents.length} event{selectedEvents.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button variant="primary" icon="add" onClick={() => addEvent(selected)}>
            Add
          </Button>
        </header>

        {selectedEvents.length === 0 ? (
          <p className="px-space-lg py-space-xl text-center font-body-sm text-body-sm text-on-surface-variant/40">
            Nothing scheduled. Add an event to this day.
          </p>
        ) : (
          <ul>
            {selectedEvents.map((event) => (
              <li
                key={event.id}
                className="group flex items-start gap-space-base px-space-xl py-space-lg border-b border-outline-variant/15 last:border-0"
              >
                <Icon name="event" size={16} className="text-primary mt-space-2xs shrink-0" />

                <div className="flex-1 min-w-0">
                  <input
                    value={event.title ?? ""}
                    onChange={(e) => updateEvent(event.id, { title: e.target.value })}
                    className="w-full bg-transparent font-headline-sm text-headline-sm text-on-surface outline-none"
                  />
                  <input
                    value={event.description ?? ""}
                    placeholder="Add a description…"
                    onChange={(e) => updateEvent(event.id, { description: e.target.value })}
                    className="w-full bg-transparent font-body-sm text-body-sm text-on-surface-variant/70 placeholder:text-on-surface-variant/30 outline-none"
                  />
                </div>

                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Menu
                    actions={[
                      {
                        label: "Delete event",
                        icon: "delete",
                        danger: true,
                        onSelect: () => deleteEvent(event.id),
                      },
                    ]}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
