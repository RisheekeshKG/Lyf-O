import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Icon } from "../../ui/Icon";
import { Badge } from "../../ui/Badge";
import { cn } from "../../lib/cn";
import type { ChatMessage } from "../../types";

export interface MessageAction {
  label: string;
  icon: string;
  run: (text: string) => Promise<void> | void;
  /** Confirmation shown in place of the label after a successful run. */
  doneLabel?: string;
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  actions?: MessageAction[];
}

export function ChatMessageBubble({ message, actions = [] }: ChatMessageBubbleProps) {
  if (message.sender === "user") {
    return (
      <div className="flex justify-end gap-space-base">
        <div className="max-w-2xl rounded-xl bg-surface-container-high px-space-lg py-space-base">
          <p className="selectable font-body-md text-body-md text-on-surface whitespace-pre-wrap">
            {message.text}
          </p>
        </div>
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
          <Icon name="person" size={16} className="text-on-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-space-base">
      <div className="w-7 h-7 rounded-full bg-primary-container/25 flex items-center justify-center shrink-0">
        <Icon name="auto_awesome" size={16} className="text-primary" />
      </div>

      <div className="flex-1 min-w-0 rounded-xl border border-outline-variant/40 bg-surface-container-low/50">
        <header className="flex items-center gap-space-sm px-space-lg py-space-sm border-b border-outline-variant/25">
          <span className="font-headline-sm text-headline-sm text-on-surface">lyf-O Assistant</span>
          <Badge tone="tertiary">Context aware</Badge>
        </header>

        <div className="selectable px-space-lg py-space-base prose prose-invert max-w-none prose-p:font-body-md prose-p:text-on-surface-variant prose-strong:text-on-surface prose-code:text-tertiary prose-headings:text-on-surface">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        </div>

        {actions.length > 0 && (
          <footer className="flex flex-wrap items-center gap-space-xs px-space-lg py-space-sm border-t border-outline-variant/25">
            {actions.map((action) => (
              <ActionButton key={action.label} action={action} text={message.text} />
            ))}
          </footer>
        )}
      </div>
    </div>
  );
}

function ActionButton({ action, text }: { action: MessageAction; text: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const run = async () => {
    if (state === "busy") return;
    setState("busy");
    try {
      await action.run(text);
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("idle");
    }
  };

  return (
    <button
      onClick={run}
      disabled={state === "busy"}
      className={cn(
        "inline-flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg font-label-sm text-label-sm transition-colors",
        state === "done"
          ? "text-tertiary"
          : "text-on-surface-variant/60 hover:text-on-surface hover:bg-surface-container",
      )}
    >
      <Icon name={state === "done" ? "check" : action.icon} size={14} />
      {state === "done" ? (action.doneLabel ?? "Done") : action.label}
    </button>
  );
}
