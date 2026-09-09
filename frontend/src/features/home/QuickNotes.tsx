import { useEffect, useState } from "react";
import { Panel, PanelHeader } from "../../ui/Panel";
import { Icon } from "../../ui/Icon";

const STORAGE_KEY = "quick_notes";

export function QuickNotes() {
  const [value, setValue] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    try {
      setValue(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      /* storage unavailable — notes stay in memory for this session */
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, value);
        setSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      } catch {
        /* ignore */
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        icon="sticky_note_2"
        title="Quick Notes"
        action={
          savedAt && (
            <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
              Saved {savedAt}
            </span>
          )
        }
      />

      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Jot something down — it stays on this machine."
        className="flex-1 min-h-40 px-space-lg py-space-base bg-transparent outline-none resize-none font-body-sm text-body-sm text-on-surface-variant placeholder:text-on-surface-variant/30"
      />

      <footer className="flex items-center justify-between px-space-lg py-space-sm border-t border-outline-variant/30">
        <div className="flex items-center gap-space-sm text-on-surface-variant/40">
          <Icon name="format_bold" size={14} />
          <Icon name="format_italic" size={14} />
          <Icon name="code" size={14} />
        </div>
        <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
          {value.trim() ? value.trim().split(/\s+/).length : 0} words
        </span>
      </footer>
    </Panel>
  );
}
