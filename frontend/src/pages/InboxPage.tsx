import { useMemo, useState } from "react";
import { headerOf, useGmail } from "../hooks/useGmail";
import { PageHeader } from "../ui/PageHeader";
import { Panel, PanelHeader } from "../ui/Panel";
import { Button, IconButton } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { EmptyState } from "../ui/EmptyState";
import { Tabs } from "../ui/Tabs";
import { TextInput } from "../ui/Field";
import { cn } from "../lib/cn";
import type { GmailMessage } from "../types";

type Filter = "all" | "unread" | "mentions" | "archived";

/** "Devon Kim <devon@example.com>" -> "Devon Kim" */
function senderName(from: string): string {
  return from.replace(/<.*>/, "").replace(/"/g, "").trim() || from;
}

function relativeTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  if (minutes < 10080) return `${Math.round(minutes / 1440)}d ago`;
  return date.toLocaleDateString();
}

export function InboxPage() {
  const { authState, messages, status, loading, signIn, signOut, refresh } = useGmail();

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());

  const searchable = (message: GmailMessage) =>
    [
      headerOf(message, "Subject"),
      headerOf(message, "From"),
      message.snippet,
    ]
      .join(" ")
      .toLowerCase();

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return messages.filter((message) => {
      if (needle && !searchable(message).includes(needle)) return false;

      switch (filter) {
        case "unread":
          return !readIds.has(message.id) && !archivedIds.has(message.id);
        case "mentions":
          return /re:|fwd:|mention/i.test(headerOf(message, "Subject"));
        case "archived":
          return archivedIds.has(message.id);
        default:
          return !archivedIds.has(message.id);
      }
    });
  }, [messages, filter, query, readIds, archivedIds]);

  const selected = visible.find((message) => message.id === selectedId) ?? visible[0];

  const open = (message: GmailMessage) => {
    setSelectedId(message.id);
    setReadIds((current) => new Set(current).add(message.id));
  };

  const toggleArchive = (id: string) =>
    setArchivedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const unreadCount = messages.filter(
    (message) => !readIds.has(message.id) && !archivedIds.has(message.id),
  ).length;

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        icon="inbox"
        eyebrow={
          <>
            <Badge tone={authState === "signed-in" ? "tertiary" : "neutral"}>
              {authState === "signed-in" ? "Live workspace stream" : "Not connected"}
            </Badge>
            {status && (
              <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
                {status}
              </span>
            )}
          </>
        }
        title="Inbox"
        description="Messages from your connected Google account, in the workspace shell."
        actions={
          authState === "signed-in" && (
            <>
              <Button
                variant="outline"
                icon="mark_email_read"
                onClick={() => setReadIds(new Set(messages.map((message) => message.id)))}
                disabled={unreadCount === 0}
              >
                Mark all read
              </Button>
              <Button variant="outline" icon="refresh" onClick={refresh} disabled={loading}>
                {loading ? "Refreshing…" : "Refresh"}
              </Button>
              <Button variant="ghost" icon="logout" onClick={signOut}>
                Sign out
              </Button>
            </>
          )
        }
      />

      {authState === "checking" && (
        <Panel>
          <EmptyState icon="progress_activity" title="Checking your Google session…" />
        </Panel>
      )}

      {authState === "signed-out" && (
        <Panel>
          <EmptyState
            icon="lock"
            title="You're not connected"
            description="Sign in with Google to read your inbox inside lyf-O."
            action={
              <Button variant="primary" icon="login" onClick={signIn} disabled={loading}>
                {loading ? "Opening…" : "Sign in with Google"}
              </Button>
            }
          />
        </Panel>
      )}

      {authState === "signed-in" && (
        <div className="grid gap-space-xl xl:grid-cols-[1.4fr_1fr] items-start">
          <Panel>
            <div className="px-space-lg pt-space-base">
              <TextInput
                value={query}
                placeholder="Search sender, subject or body…"
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>

            <Tabs
              className="px-space-lg mt-space-base"
              active={filter}
              onChange={setFilter}
              tabs={[
                { id: "all", label: "All", count: messages.length - archivedIds.size },
                { id: "unread", label: "Unread", count: unreadCount },
                { id: "mentions", label: "Threads" },
                { id: "archived", label: "Archived", count: archivedIds.size },
              ]}
            />

            {visible.length === 0 ? (
              <EmptyState
                icon="mail"
                title={query ? "No messages match that search" : "Nothing here"}
              />
            ) : (
              <ul>
                {visible.map((message) => {
                  const from = senderName(headerOf(message, "From", "Unknown sender"));
                  const subject = headerOf(message, "Subject", "(No subject)");
                  const isActive = selected?.id === message.id;
                  const isUnread = !readIds.has(message.id);

                  return (
                    <li key={message.id} className="group relative">
                      <button
                        onClick={() => open(message)}
                        className={cn(
                          "w-full text-left flex gap-space-base px-space-xl py-space-lg border-b border-outline-variant/15 transition-colors",
                          isActive ? "bg-surface-container-low" : "hover:bg-surface-container-low/50",
                        )}
                      >
                        <div className="pt-space-2xs shrink-0">
                          <span
                            className={cn(
                              "block w-2 h-2 rounded-full",
                              isUnread ? "bg-primary-container" : "bg-transparent",
                            )}
                          />
                        </div>

                        <Avatar name={from} size={28} />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-space-base">
                            <span
                              className={cn(
                                "truncate font-headline-sm text-headline-sm",
                                isUnread ? "text-on-surface" : "text-on-surface-variant/70",
                              )}
                            >
                              {subject}
                            </span>
                            <span className="font-mono-badge text-mono-badge text-on-surface-variant/40 shrink-0">
                              {relativeTime(headerOf(message, "Date"))}
                            </span>
                          </div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant/60 truncate">
                            {from}
                          </p>
                          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/70 line-clamp-2">
                            {message.snippet}
                          </p>
                        </div>
                      </button>

                      <div className="absolute right-space-lg top-space-base opacity-0 group-hover:opacity-100 transition-opacity">
                        <IconButton
                          icon={archivedIds.has(message.id) ? "unarchive" : "archive"}
                          label={archivedIds.has(message.id) ? "Unarchive" : "Archive"}
                          onClick={() => toggleArchive(message.id)}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel className="sticky top-space-2xl">
            <PanelHeader icon="forum" title="Active thread" />

            {selected ? (
              <div className="px-space-lg py-space-lg">
                <h3 className="font-headline-md text-headline-md text-on-surface mb-space-base">
                  {headerOf(selected, "Subject", "(No subject)")}
                </h3>

                <div className="flex gap-space-base">
                  <Avatar name={senderName(headerOf(selected, "From", "Unknown"))} size={28} />
                  <div className="min-w-0">
                    <p className="font-headline-sm text-headline-sm text-on-surface">
                      {senderName(headerOf(selected, "From", "Unknown sender"))}
                    </p>
                    <p className="font-mono-badge text-mono-badge text-on-surface-variant/40">
                      {headerOf(selected, "Date")}
                    </p>
                    <p className="selectable mt-space-base font-body-md text-body-md text-on-surface-variant/80">
                      {selected.snippet}
                    </p>
                  </div>
                </div>

                <footer className="mt-space-xl pt-space-base border-t border-outline-variant/25 flex items-center gap-space-sm">
                  <Button
                    variant="outline"
                    icon={archivedIds.has(selected.id) ? "unarchive" : "archive"}
                    onClick={() => toggleArchive(selected.id)}
                  >
                    {archivedIds.has(selected.id) ? "Unarchive" : "Archive"}
                  </Button>
                  <span className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant/40">
                    <Icon name="reply" size={15} />
                    Open in Gmail to reply
                  </span>
                </footer>
              </div>
            ) : (
              <EmptyState icon="forum" title="Select a message" />
            )}
          </Panel>
        </div>
      )}
    </div>
  );
}
