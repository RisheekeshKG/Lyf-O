import { useMemo } from "react";
import { Icon } from "../../../ui/Icon";
import { Panel, PanelHeader } from "../../../ui/Panel";
import { ProgressBar } from "../../../ui/ProgressBar";
import { Button } from "../../../ui/Button";
import { Menu } from "../../../ui/Menu";
import { cn } from "../../../lib/cn";
import type { ViewProps } from "./types";

const toKey = (date: Date) => date.toISOString().slice(0, 10);

/** The trailing week, oldest first, so the grid reads left-to-right. */
function lastSevenDays(): Date[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(today);
    day.setDate(today.getDate() - (6 - index));
    return day;
  });
}

/** Consecutive completed days counting back from today. */
function streakOf(log: Record<string, boolean>): number {
  let streak = 0;
  const cursor = new Date();
  while (log[toKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function HabitView({ data, onChange }: ViewProps) {
  // Older saves stored habits as a flat `items` list; surface them in the same grid.
  const habits: any[] = useMemo(() => {
    if (Array.isArray(data.habits) && data.habits.length > 0) return data.habits;
    if (Array.isArray(data.items)) {
      return data.items.map((item: any) => ({
        name: item.habit ?? item.task ?? "Habit",
        goal: 7,
        log: {},
        streak: 0,
      }));
    }
    return [];
  }, [data.habits, data.items]);

  const week = useMemo(lastSevenDays, []);

  const writeHabits = (next: any[]) => onChange({ ...data, habits: next, items: undefined });

  const toggle = (habitIndex: number, dateKey: string) =>
    writeHabits(
      habits.map((habit, index) => {
        if (index !== habitIndex) return habit;
        const log = { ...(habit.log ?? {}) };
        if (log[dateKey]) delete log[dateKey];
        else log[dateKey] = true;
        return { ...habit, log, streak: streakOf(log) };
      }),
    );

  const addHabit = () =>
    writeHabits([...habits, { name: "New habit", goal: 7, log: {}, streak: 0 }]);

  const completedToday = habits.filter((habit) => habit.log?.[toKey(new Date())]).length;

  return (
    <div className="flex flex-col gap-space-lg">
      <Panel>
        <PanelHeader
          icon="local_fire_department"
          title="This week"
          count={`${completedToday}/${habits.length} done today`}
          action={
            <Button variant="primary" icon="add" onClick={addHabit}>
              Add habit
            </Button>
          }
        />

        {habits.length === 0 ? (
          <p className="px-space-lg py-space-xl text-center font-body-sm text-body-sm text-on-surface-variant/40">
            No habits yet. Add one to start tracking.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="px-space-lg py-space-sm text-left font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
                    Habit
                  </th>
                  {week.map((day) => (
                    <th key={toKey(day)} className="px-space-xs py-space-sm w-12">
                      <div className="font-mono-badge text-mono-badge uppercase text-on-surface-variant/40">
                        {day.toLocaleDateString("en-US", { weekday: "narrow" })}
                      </div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant/60">
                        {day.getDate()}
                      </div>
                    </th>
                  ))}
                  <th className="px-space-lg py-space-sm text-right font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
                    Streak
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>

              <tbody>
                {habits.map((habit, habitIndex) => {
                  const log: Record<string, boolean> = habit.log ?? {};
                  const streak = habit.streak ?? streakOf(log);

                  return (
                    <tr
                      key={habitIndex}
                      className="group border-b border-outline-variant/15 hover:bg-surface-container-low/40 transition-colors"
                    >
                      <td className="px-space-lg py-space-sm">
                        <input
                          value={habit.name ?? ""}
                          onChange={(event) =>
                            writeHabits(
                              habits.map((entry, index) =>
                                index === habitIndex
                                  ? { ...entry, name: event.target.value }
                                  : entry,
                              ),
                            )
                          }
                          className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none"
                        />
                        <ProgressBar
                          value={streak}
                          max={habit.goal ?? 7}
                          className="mt-space-xs max-w-40"
                        />
                      </td>

                      {week.map((day) => {
                        const key = toKey(day);
                        const done = Boolean(log[key]);
                        return (
                          <td key={key} className="px-space-xs py-space-sm text-center">
                            <button
                              onClick={() => toggle(habitIndex, key)}
                              aria-label={`${habit.name} on ${key}`}
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center border transition-colors",
                                done
                                  ? "bg-tertiary-container border-tertiary-container text-on-tertiary-container"
                                  : "border-outline-variant/40 text-transparent hover:border-outline",
                              )}
                            >
                              <Icon name="check" size={14} />
                            </button>
                          </td>
                        );
                      })}

                      <td className="px-space-lg py-space-sm text-right">
                        <span className="inline-flex items-center gap-space-2xs text-secondary">
                          <Icon name="local_fire_department" size={15} />
                          <span className="font-mono-badge text-mono-badge">{streak}</span>
                        </span>
                      </td>

                      <td className="pr-space-base">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Menu
                            actions={[
                              {
                                label: "Reset streak",
                                icon: "restart_alt",
                                onSelect: () =>
                                  writeHabits(
                                    habits.map((entry, index) =>
                                      index === habitIndex
                                        ? { ...entry, log: {}, streak: 0 }
                                        : entry,
                                    ),
                                  ),
                              },
                              {
                                label: "Delete habit",
                                icon: "delete",
                                danger: true,
                                onSelect: () =>
                                  writeHabits(habits.filter((_, index) => index !== habitIndex)),
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
