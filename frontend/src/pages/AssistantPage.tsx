import { useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { useChat } from "../hooks/useChat";
import { WEEKLY_NOTES_FILE } from "../features/workspace/seeds";
import { suggestedPrompts } from "../features/profile/personalization";
import type { MessageAction } from "../features/assistant/ChatMessageBubble";
import { PageHeader } from "../ui/PageHeader";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { ChatMessageBubble } from "../features/assistant/ChatMessageBubble";
import { ChatComposer } from "../features/assistant/ChatComposer";

const DEFAULT_PROMPTS = [
  {
    icon: "summarize",
    title: "Summarize my tasks",
    detail: "Pull the open items across every page into one briefing.",
    prompt: "Summarize all my open tasks and highlight what looks most urgent.",
  },
  {
    icon: "edit_note",
    title: "Draft a weekly review",
    detail: "Turn this week's pages into a structured retrospective.",
    prompt: "Draft a weekly review based on my workspace pages.",
  },
  {
    icon: "table_chart",
    title: "Create a tracker",
    detail: "Generate a new table page with the columns you describe.",
    prompt: "Create a habit tracker table with columns for habit, streak and goal.",
  },
  {
    icon: "lightbulb",
    title: "Suggest routines",
    detail: "Get lifestyle routines that fit your profile.",
    prompt: "Suggest a daily routine that fits my profile and current workload.",
  },
];

export function AssistantPage() {
  const { reload, dataFiles, updateFile, createFile, personal } = useWorkspace();
  const { messages, sending, send, reset } = useChat({ onFileCreated: reload });
  const endRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const actions = useMemo<MessageAction[]>(
    () => [
      {
        label: "Copy markdown",
        doneLabel: "Copied",
        icon: "content_copy",
        run: (text) => navigator.clipboard.writeText(text),
      },
      {
        label: "Insert into Weekly Notes",
        doneLabel: "Inserted",
        icon: "note_add",
        run: async (text) => {
          const notes = dataFiles.find((entry) => entry.file === WEEKLY_NOTES_FILE);
          if (!notes) return;
          const stamp = new Date().toLocaleString();
          await updateFile(WEEKLY_NOTES_FILE, {
            ...notes.data,
            content: `${notes.data.content ?? ""}\n\n## From the assistant — ${stamp}\n\n${text}\n`,
            lastEdited: new Date().toISOString(),
          });
        },
      },
      {
        label: "Save as page",
        doneLabel: "Saved",
        icon: "bookmark_add",
        run: async (text) => {
          const heading = text.match(/^#+\s*(.+)$/m)?.[1];
          const name = (heading ?? `Assistant note ${new Date().toLocaleDateString()}`).slice(0, 60);
          const file = await createFile({
            name,
            type: "document",
            content: text,
            lastEdited: new Date().toISOString(),
          });
          navigate(`/pages/${encodeURIComponent(file)}`);
        },
      },
    ],
    [dataFiles, updateFile, createFile, navigate],
  );

  // Personal starters first, topped up with the generic ones.
  const prompts = useMemo(() => {
    const personalised = suggestedPrompts(personal);
    return [...personalised, ...DEFAULT_PROMPTS].slice(0, 4);
  }, [personal]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  return (
    <div className="flex flex-col h-[calc(100vh-var(--spacing-titlebar-height))] px-space-4xl py-space-3xl">
      <PageHeader
        eyebrow={
          <>
            <Badge tone="tertiary">Ready</Badge>
            <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
              Knows about your pages
            </span>
          </>
        }
        title="lyf-O Intelligence"
        description="Context-aware workspace copilot. Ask about your pages, or describe a page and it will be created for you."
        actions={
          messages.length > 0 && (
            <Button variant="outline" icon="restart_alt" onClick={reset}>
              New thread
            </Button>
          )
        }
      />

      <div className="flex-1 min-h-0 overflow-y-auto pr-space-xs">
        {messages.length === 0 ? (
          <div className="grid gap-space-xl sm:grid-cols-2">
            {prompts.map((item) => (
              <button
                key={item.title}
                onClick={() => send(item.prompt)}
                className="text-left rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-space-lg hover:border-primary-container/50 transition-colors"
              >
                <Icon name={item.icon} size={20} className="text-primary mb-space-base" />
                <h3 className="font-headline-sm text-headline-sm text-on-surface">{item.title}</h3>
                <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/70">
                  {item.detail}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-space-lg">
            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                actions={message.sender === "ai" ? actions : undefined}
              />
            ))}

            {sending && (
              <div className="flex items-center gap-space-sm px-space-lg font-body-sm text-body-sm text-on-surface-variant/50">
                <Icon name="progress_activity" size={16} className="animate-spin" />
                Thinking…
              </div>
            )}

            <div ref={endRef} />
          </div>
        )}
      </div>

      <div className="pt-space-lg">
        <ChatComposer disabled={sending} onSend={send} />
      </div>
    </div>
  );
}
