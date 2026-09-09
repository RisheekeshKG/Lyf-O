import { useState } from "react";
import { Icon } from "../../ui/Icon";
import { Button } from "../../ui/Button";

interface ChatComposerProps {
  disabled: boolean;
  onSend: (text: string) => void;
}

export function ChatComposer({ disabled, onSend }: ChatComposerProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
  };

  return (
    <div className="rounded-xl border border-outline-variant/50 bg-surface-container-low/60 focus-within:border-primary-container/60 transition-colors">
      <div className="flex items-end gap-space-base px-space-lg py-space-base">
        <Icon name="prompt_suggestion" size={18} className="text-primary shrink-0 mb-space-2xs" />

        <textarea
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Ask lyf-O AI — reference a page, or describe a page to create…"
          className="flex-1 max-h-40 bg-transparent outline-none resize-none font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant/40 disabled:opacity-50"
        />

        <Button variant="primary" icon="send" onClick={submit} disabled={disabled || !value.trim()}>
          {disabled ? "Thinking…" : "Send"}
        </Button>
      </div>

      <footer className="flex items-center justify-between px-space-lg py-space-sm border-t border-outline-variant/25">
        <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
          Enter to send · Shift+Enter for a new line
        </span>
        <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
          {value.length} chars
        </span>
      </footer>
    </div>
  );
}
