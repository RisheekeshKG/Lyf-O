import { useState } from "react";
import { Panel } from "../../../ui/Panel";
import { Badge } from "../../../ui/Badge";
import { Button } from "../../../ui/Button";
import { Menu } from "../../../ui/Menu";
import { Icon } from "../../../ui/Icon";
import { cn } from "../../../lib/cn";
import type { ViewProps } from "./types";

const MOODS = ["Great", "Good", "Neutral", "Low", "Rough"];

const MOOD_TONE: Record<string, "tertiary" | "secondary" | "neutral" | "error"> = {
  Great: "tertiary",
  Good: "tertiary",
  Neutral: "neutral",
  Low: "secondary",
  Rough: "error",
};

export function JournalView({ data, onChange }: ViewProps) {
  const entries: any[] = data.entries ?? [];
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const writeEntries = (next: any[]) => onChange({ ...data, entries: next });

  const addEntry = () => {
    writeEntries([
      { date: new Date().toISOString(), title: "New entry", content: "", mood: "Neutral" },
      ...entries,
    ]);
    setEditingIndex(0);
  };

  const patch = (index: number, changes: any) =>
    writeEntries(entries.map((entry, i) => (i === index ? { ...entry, ...changes } : entry)));

  return (
    <div className="flex flex-col gap-space-base max-w-3xl">
      <div className="flex items-center justify-between">
        <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
          {entries.length} {entries.length === 1 ? "entry" : "entries"}
        </span>
        <Button variant="primary" icon="add" onClick={addEntry}>
          New entry
        </Button>
      </div>

      {entries.length === 0 && (
        <Panel className="py-space-3xl">
          <p className="text-center font-body-sm text-body-sm text-on-surface-variant/40">
            No entries yet. Write your first one.
          </p>
        </Panel>
      )}

      {entries.map((entry, index) => {
        const isEditing = editingIndex === index;
        const body = entry.content ?? entry.entry ?? "";

        return (
          <Panel key={index} className="p-space-xl group">
            <div className="flex items-start justify-between gap-space-base mb-space-sm">
              <div className="flex items-center gap-space-sm flex-wrap">
                <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
                  {new Date(entry.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>

                {isEditing ? (
                  <select
                    value={entry.mood ?? "Neutral"}
                    onChange={(event) => patch(index, { mood: event.target.value })}
                    className="bg-surface-container-lowest border border-outline-variant/50 rounded px-space-xs py-space-2xs font-mono-badge text-mono-badge text-on-surface-variant outline-none"
                  >
                    {MOODS.map((mood) => (
                      <option key={mood} value={mood}>
                        {mood}
                      </option>
                    ))}
                  </select>
                ) : (
                  entry.mood && <Badge tone={MOOD_TONE[entry.mood] ?? "neutral"}>{entry.mood}</Badge>
                )}
              </div>

              <div className={cn("transition-opacity", isEditing ? "" : "opacity-0 group-hover:opacity-100")}>
                <Menu
                  actions={[
                    {
                      label: isEditing ? "Done editing" : "Edit entry",
                      icon: isEditing ? "check" : "edit",
                      onSelect: () => setEditingIndex(isEditing ? null : index),
                    },
                    {
                      label: "Delete entry",
                      icon: "delete",
                      danger: true,
                      onSelect: () => {
                        writeEntries(entries.filter((_, i) => i !== index));
                        setEditingIndex(null);
                      },
                    },
                  ]}
                />
              </div>
            </div>

            {isEditing ? (
              <>
                <input
                  autoFocus
                  value={entry.title ?? ""}
                  placeholder="Title"
                  onChange={(event) => patch(index, { title: event.target.value })}
                  className="w-full mb-space-sm bg-transparent font-headline-md text-headline-md text-on-surface outline-none placeholder:text-on-surface-variant/30"
                />
                <textarea
                  value={body}
                  placeholder="What happened today?"
                  onChange={(event) => patch(index, { content: event.target.value, entry: undefined })}
                  className="w-full min-h-40 bg-transparent font-body-md text-body-md text-on-surface-variant/80 outline-none resize-none placeholder:text-on-surface-variant/30"
                />
                <div className="flex justify-end">
                  <Button variant="secondary" icon="check" onClick={() => setEditingIndex(null)}>
                    Done
                  </Button>
                </div>
              </>
            ) : (
              <button onClick={() => setEditingIndex(index)} className="w-full text-left">
                {entry.title && (
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-space-sm">
                    {entry.title}
                  </h3>
                )}
                {body ? (
                  <p className="selectable font-body-md text-body-md text-on-surface-variant/80 whitespace-pre-wrap">
                    {body}
                  </p>
                ) : (
                  <span className="inline-flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant/30">
                    <Icon name="edit" size={14} />
                    Empty — click to write
                  </span>
                )}
              </button>
            )}
          </Panel>
        );
      })}
    </div>
  );
}
