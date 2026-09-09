import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../../context/WorkspaceContext";
import { Icon } from "../../ui/Icon";
import { cn } from "../../lib/cn";
import { DOCUMENT_META, iconForType } from "../documents/documentMeta";
import { MANAGED_FILES } from "../workspace/seeds";
import type { DocumentType } from "../../types";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  group: "Pages" | "Navigate" | "Actions";
  run: () => void;
}

const ROUTES: { label: string; path: string; icon: string }[] = [
  { label: "Home", path: "/", icon: "home" },
  { label: "AI Assistant", path: "/assistant", icon: "auto_awesome" },
  { label: "Inbox", path: "/inbox", icon: "inbox" },
  { label: "Recommend", path: "/recommend", icon: "star" },
  { label: "Work Tasks", path: "/tasks", icon: "view_kanban" },
  { label: "Product Roadmap", path: "/roadmap", icon: "rocket_launch" },
  { label: "Weekly Notes", path: "/notes", icon: "edit_note" },
  { label: "Shared Resources", path: "/resources", icon: "folder_shared" },
  { label: "Settings", path: "/settings", icon: "settings" },
];

/** Surfaces matching text from inside a page so search reaches content, not just titles. */
function excerptOf(data: any, query: string): string | undefined {
  if (!query) return undefined;
  const needle = query.toLowerCase();

  const haystack: string[] = [];
  if (typeof data?.content === "string") haystack.push(...data.content.split("\n"));
  for (const item of data?.items ?? []) if (item.task) haystack.push(item.task);
  for (const row of data?.values ?? []) haystack.push(row.filter(Boolean).join(" · "));
  for (const column of data?.columns ?? []) {
    for (const card of column.tasks ?? column.cards ?? []) {
      haystack.push(typeof card === "string" ? card : card.title);
    }
  }
  for (const entry of data?.entries ?? []) haystack.push(entry.title ?? entry.content ?? "");

  return haystack.find((line) => line?.toLowerCase().includes(needle))?.trim().slice(0, 80);
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { dataFiles, openCreate, reload } = useWorkspace();
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (path: string) => () => {
      navigate(path);
      onClose();
    };

    return [
      ...dataFiles.map((entry) => ({
        id: `page:${entry.file}`,
        label: entry.name,
        hint: excerptOf(entry.data, query) ?? DOCUMENT_META[entry.data?.type as DocumentType]?.label,
        icon: iconForType(entry.data?.type),
        group: "Pages" as const,
        run: go(
          MANAGED_FILES.has(entry.file)
            ? { "work_tasks.json": "/tasks", "product_roadmap.json": "/roadmap", "weekly_notes.json": "/notes" }[
                entry.file
              ]!
            : `/pages/${encodeURIComponent(entry.file)}`,
        ),
      })),
      ...ROUTES.map((route) => ({
        id: `route:${route.path}`,
        label: route.label,
        icon: route.icon,
        group: "Navigate" as const,
        run: go(route.path),
      })),
      {
        id: "action:new",
        label: "Create new page",
        icon: "add",
        group: "Actions" as const,
        run: () => {
          onClose();
          openCreate();
        },
      },
      {
        id: "action:profile",
        label: "Edit your profile",
        icon: "person",
        group: "Actions" as const,
        run: go("/profile"),
      },
      {
        id: "action:reload",
        label: "Reload workspace from disk",
        icon: "refresh",
        group: "Actions" as const,
        run: () => {
          onClose();
          reload();
        },
      },
    ];
  }, [dataFiles, navigate, onClose, openCreate, reload, query]);

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return commands;

    return commands.filter((command) => {
      if (command.label.toLowerCase().includes(needle)) return true;
      return Boolean(command.hint?.toLowerCase().includes(needle));
    });
  }, [commands, query]);

  useEffect(() => setCursor(0), [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setCursor((current) => Math.min(current + 1, results.length - 1));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setCursor((current) => Math.max(current - 1, 0));
      }
      if (event.key === "Enter") {
        event.preventDefault();
        results[cursor]?.run();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [results, cursor, onClose]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-index="${cursor}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  let lastGroup = "";

  return (
    <div
      className="fixed inset-0 z-[110] flex items-start justify-center bg-black/70 backdrop-blur-sm pt-[12vh] px-space-lg"
      onClick={onClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-xl rounded-xl border border-outline-variant/50 bg-surface-container shadow-2xl overflow-hidden"
      >
        <div className="flex items-center gap-space-base px-space-lg py-space-base border-b border-outline-variant/30">
          <Icon name="search" size={18} className="text-on-surface-variant/50" />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search pages, jump to a section, run an action…"
            className="flex-1 bg-transparent font-body-lg text-body-lg text-on-surface outline-none placeholder:text-on-surface-variant/30"
          />
          <kbd className="px-space-xs py-space-2xs rounded bg-surface-container-high font-mono-badge text-mono-badge text-on-surface-variant/60">
            ESC
          </kbd>
        </div>

        <div ref={listRef} className="max-h-96 overflow-y-auto py-space-xs">
          {results.length === 0 ? (
            <p className="px-space-lg py-space-xl text-center font-body-sm text-body-sm text-on-surface-variant/40">
              Nothing matches “{query}”.
            </p>
          ) : (
            results.map((command, index) => {
              const showGroup = command.group !== lastGroup;
              lastGroup = command.group;

              return (
                <div key={command.id}>
                  {showGroup && (
                    <div className="px-space-lg pt-space-sm pb-space-2xs font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/40">
                      {command.group}
                    </div>
                  )}

                  <button
                    data-index={index}
                    onMouseEnter={() => setCursor(index)}
                    onClick={command.run}
                    className={cn(
                      "w-full flex items-center gap-space-base px-space-lg py-space-sm text-left transition-colors",
                      index === cursor ? "bg-surface-container-high" : "hover:bg-surface-container-low",
                    )}
                  >
                    <Icon
                      name={command.icon}
                      size={16}
                      className={index === cursor ? "text-primary" : "text-on-surface-variant/60"}
                    />
                    <span className="flex-1 min-w-0">
                      <span className="block font-body-md text-body-md text-on-surface truncate">
                        {command.label}
                      </span>
                      {command.hint && (
                        <span className="block font-mono-badge text-mono-badge text-on-surface-variant/40 truncate">
                          {command.hint}
                        </span>
                      )}
                    </span>
                    {index === cursor && (
                      <Icon name="keyboard_return" size={14} className="text-on-surface-variant/40" />
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <footer className="flex items-center gap-space-lg px-space-lg py-space-sm border-t border-outline-variant/30 font-mono-badge text-mono-badge text-on-surface-variant/40">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span className="ml-auto">
            {results.length} result{results.length === 1 ? "" : "s"}
          </span>
        </footer>
      </div>
    </div>
  );
}
