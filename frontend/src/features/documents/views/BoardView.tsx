import { useState } from "react";
import { Badge } from "../../../ui/Badge";
import { Icon } from "../../../ui/Icon";
import { Menu } from "../../../ui/Menu";
import { cn } from "../../../lib/cn";
import type { ViewProps } from "./types";

interface BoardCard {
  title: string;
  description?: string;
}

/** Older files stored cards as plain strings under `cards`; newer ones use `tasks`. */
function cardsOf(column: any): BoardCard[] {
  const raw = column.tasks ?? column.cards ?? [];
  return raw.map((entry: any) =>
    typeof entry === "string"
      ? { title: entry }
      : { title: entry.title ?? "", description: entry.description },
  );
}

export function BoardView({ data, onChange }: ViewProps) {
  const columns: any[] = data.columns ?? [];
  const [draft, setDraft] = useState<{ column: number; title: string } | null>(null);
  const [editing, setEditing] = useState<{ column: number; card: number } | null>(null);

  const writeColumns = (next: any[]) => onChange({ ...data, columns: next });

  const setCards = (columnIndex: number, cards: BoardCard[]) =>
    writeColumns(
      columns.map((column, index) =>
        index === columnIndex ? { ...column, tasks: cards, cards: undefined } : column,
      ),
    );

  const addCard = (columnIndex: number, title: string) => {
    if (!title.trim()) return;
    setCards(columnIndex, [...cardsOf(columns[columnIndex]), { title: title.trim() }]);
  };

  const moveCard = (from: number, cardIndex: number, to: number) => {
    if (from === to) return;
    const card = cardsOf(columns[from])[cardIndex];
    const next = columns.map((column, index) => {
      if (index === from) {
        return {
          ...column,
          tasks: cardsOf(column).filter((_, i) => i !== cardIndex),
          cards: undefined,
        };
      }
      if (index === to) {
        return { ...column, tasks: [...cardsOf(column), card], cards: undefined };
      }
      return column;
    });
    writeColumns(next);
  };

  const addColumn = () =>
    writeColumns([...columns, { name: `Lane ${columns.length + 1}`, tasks: [] }]);

  return (
    <div className="flex gap-space-lg overflow-x-auto pb-space-lg items-start">
      {columns.map((column, columnIndex) => {
        const cards = cardsOf(column);
        return (
          <section key={columnIndex} className="w-72 shrink-0">
            <header className="flex items-center justify-between mb-space-base px-space-xs">
              <div className="flex items-center gap-space-sm min-w-0">
                <InlineText
                  value={column.name ?? ""}
                  className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/60"
                  onChange={(name) =>
                    writeColumns(
                      columns.map((entry, index) =>
                        index === columnIndex ? { ...entry, name } : entry,
                      ),
                    )
                  }
                />
                <Badge>{cards.length}</Badge>
              </div>

              <Menu
                actions={[
                  {
                    label: "Add card",
                    icon: "add",
                    onSelect: () => setDraft({ column: columnIndex, title: "" }),
                  },
                  {
                    label: "Clear lane",
                    icon: "backspace",
                    onSelect: () => setCards(columnIndex, []),
                    disabled: cards.length === 0,
                  },
                  {
                    label: "Delete lane",
                    icon: "delete",
                    danger: true,
                    onSelect: () =>
                      writeColumns(columns.filter((_, index) => index !== columnIndex)),
                  },
                ]}
              />
            </header>

            <div className="flex flex-col gap-space-sm">
              {cards.map((card, cardIndex) => {
                const isEditing =
                  editing?.column === columnIndex && editing?.card === cardIndex;

                return (
                  <article
                    key={cardIndex}
                    className="group rounded-xl border border-outline-variant/40 bg-surface-container-low/60 px-space-base py-space-base hover:border-outline-variant transition-colors"
                  >
                    <div className="flex items-start justify-between gap-space-sm">
                      <div className="min-w-0 flex-1">
                        <InlineText
                          value={card.title}
                          editing={isEditing}
                          onDone={() => setEditing(null)}
                          className="font-headline-sm text-headline-sm text-on-surface"
                          onChange={(title) =>
                            setCards(
                              columnIndex,
                              cards.map((entry, i) => (i === cardIndex ? { ...entry, title } : entry)),
                            )
                          }
                        />
                        {card.description && (
                          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/70">
                            {card.description}
                          </p>
                        )}
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Menu
                          actions={[
                            {
                              label: "Rename",
                              icon: "edit",
                              onSelect: () => setEditing({ column: columnIndex, card: cardIndex }),
                            },
                            ...columns
                              .map((target, targetIndex) => ({ target, targetIndex }))
                              .filter(({ targetIndex }) => targetIndex !== columnIndex)
                              .map(({ target, targetIndex }) => ({
                                label: `Move to ${target.name}`,
                                icon: "arrow_forward",
                                onSelect: () => moveCard(columnIndex, cardIndex, targetIndex),
                              })),
                            {
                              label: "Delete card",
                              icon: "delete",
                              danger: true,
                              onSelect: () =>
                                setCards(
                                  columnIndex,
                                  cards.filter((_, i) => i !== cardIndex),
                                ),
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}

              {draft?.column === columnIndex ? (
                <input
                  autoFocus
                  value={draft.title}
                  placeholder="Card title…"
                  onChange={(event) => setDraft({ column: columnIndex, title: event.target.value })}
                  onBlur={() => {
                    addCard(columnIndex, draft.title);
                    setDraft(null);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addCard(columnIndex, draft.title);
                      setDraft({ column: columnIndex, title: "" });
                    }
                    if (event.key === "Escape") setDraft(null);
                  }}
                  className="rounded-xl border border-primary-container/60 bg-surface-container-low px-space-base py-space-base font-body-md text-body-md text-on-surface outline-none"
                />
              ) : (
                <button
                  onClick={() => setDraft({ column: columnIndex, title: "" })}
                  className="flex items-center gap-space-xs px-space-base py-space-sm rounded-xl border border-dashed border-outline-variant/40 font-body-sm text-body-sm text-on-surface-variant/50 hover:text-on-surface hover:border-outline-variant transition-colors"
                >
                  <Icon name="add" size={14} />
                  New card
                </button>
              )}
            </div>
          </section>
        );
      })}

      <button
        onClick={addColumn}
        className="w-52 shrink-0 flex items-center justify-center gap-space-xs px-space-base py-space-base rounded-xl border border-dashed border-outline-variant/40 font-body-sm text-body-sm text-on-surface-variant/50 hover:text-on-surface hover:border-outline-variant transition-colors"
      >
        <Icon name="add" size={14} />
        Add lane
      </button>
    </div>
  );
}

interface InlineTextProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  editing?: boolean;
  onDone?: () => void;
}

/** Click-to-edit label used for lane names and card titles. */
function InlineText({ value, onChange, className, editing, onDone }: InlineTextProps) {
  const [local, setLocal] = useState(false);
  const isEditing = editing ?? local;

  const stop = () => {
    setLocal(false);
    onDone?.();
  };

  if (!isEditing) {
    return (
      <button
        onClick={() => setLocal(true)}
        className={cn("text-left truncate hover:text-on-surface transition-colors", className)}
      >
        {value || "Untitled"}
      </button>
    );
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={stop}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "Escape") event.currentTarget.blur();
      }}
      className={cn(
        "w-full bg-surface-container-lowest border border-primary-container/60 rounded px-space-xs py-space-2xs outline-none",
        className,
      )}
    />
  );
}
