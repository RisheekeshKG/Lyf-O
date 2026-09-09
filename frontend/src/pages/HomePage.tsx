import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { PageHeader } from "../ui/PageHeader";
import { StatTile } from "../ui/StatTile";
import { Panel, PanelHeader } from "../ui/Panel";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { ProgressBar } from "../ui/ProgressBar";
import { EmptyState } from "../ui/EmptyState";
import { QuickNotes } from "../features/home/QuickNotes";
import { ActivityFeed } from "../features/home/ActivityFeed";
import { FocusPanel } from "../features/home/FocusPanel";
import { formatDate, isOverdue, pillClass } from "../features/documents/views/cellStyles";
import { cn } from "../lib/cn";
import { deriveStats, greetingFor } from "../features/home/workspaceStats";
import { DOCUMENT_META, iconForType } from "../features/documents/documentMeta";
import type { DocumentType } from "../types";

export function HomePage() {
  const { dataFiles, loading, openCreate, personal, savePersonal } = useWorkspace();
  const navigate = useNavigate();

  const stats = useMemo(() => deriveStats(dataFiles), [dataFiles]);
  const now = new Date();

  const openTasks = stats.priorityTasks.filter((task) => !task.done).slice(0, 6);
  const recentPages = dataFiles.slice(0, 3);

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        eyebrow={
          <>
            <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span className="text-on-surface-variant/30">·</span>
            <Badge tone="tertiary">
              {stats.pageCount} {stats.pageCount === 1 ? "page" : "pages"}
            </Badge>
          </>
        }
        title={`${greetingFor(now)}, ${personal.name.trim() || "there"}`}
        description={
          stats.openTasks > 0
            ? `You have ${stats.openTasks} open ${stats.openTasks === 1 ? "task" : "tasks"} across ${stats.pageCount} ${stats.pageCount === 1 ? "page" : "pages"}.`
            : "Everything on your board is clear. Start something new when you're ready."
        }
        actions={
          <>
            <Button variant="primary" icon="add" onClick={openCreate}>
              New Page
            </Button>
            <Button variant="outline" icon="auto_awesome" onClick={() => navigate("/assistant")}>
              Draft with AI
            </Button>
          </>
        }
      />

      <div className="grid gap-space-xl sm:grid-cols-2 xl:grid-cols-4 mb-space-3xl">
        <StatTile
          label="Task Completion"
          value={`${stats.completionRate}%`}
          detail={`${stats.completedTasks} of ${stats.totalTasks} done`}
          icon="donut_large"
          iconClassName="text-primary-container"
        />
        <StatTile
          label="Open Tasks"
          value={String(stats.openTasks)}
          detail={stats.openTasks > 0 ? "awaiting action" : "all clear"}
          icon="checklist"
        />
        <StatTile
          label="Completed"
          value={String(stats.completedTasks)}
          detail={stats.completedTasks > 0 ? "keep it up" : "nothing yet"}
          icon="task_alt"
          iconClassName="text-tertiary"
        />
        <StatTile
          label="Pages"
          value={String(stats.pageCount)}
          detail="in your workspace"
          icon="folder"
        />
      </div>

      <Panel className="mb-space-3xl">
        <PanelHeader
          icon="history"
          title="Jump Back In"
          action={
            <Link
              to="/tasks"
              className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
            >
              View all
            </Link>
          }
        />

        {recentPages.length === 0 ? (
          <EmptyState
            icon="note_add"
            title="No pages yet"
            description="Create your first page to get started."
            action={
              <Button variant="primary" icon="add" onClick={openCreate}>
                New Page
              </Button>
            }
          />
        ) : (
          <div className="grid gap-space-lg p-space-xl md:grid-cols-3">
            {recentPages.map((entry) => (
              <Link
                key={entry.file}
                to={`/pages/${encodeURIComponent(entry.file)}`}
                className="rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-space-lg hover:border-outline-variant transition-colors"
              >
                <div className="flex items-center justify-between mb-space-base">
                  <div className="w-8 h-8 rounded-lg bg-primary-container/20 flex items-center justify-center">
                    <Icon
                      name={iconForType(entry.data?.type)}
                      size={16}
                      className="text-primary"
                    />
                  </div>
                  <Badge tone="primary">
                    {DOCUMENT_META[entry.data?.type as DocumentType]?.label ?? "Page"}
                  </Badge>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface truncate">
                  {entry.name}
                </h3>
                <p className="mt-space-2xs font-label-sm text-label-sm text-on-surface-variant/50 truncate">
                  {entry.modified
                    ? `Edited ${new Date(entry.modified).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
                    : "Not edited yet"}
                </p>
              </Link>
            ))}
          </div>
        )}
      </Panel>

      <div className="grid gap-space-xl xl:grid-cols-[1.6fr_1fr]">
        <Panel>
          <PanelHeader
            icon="flag"
            title="My Priority Tasks"
            count={`${openTasks.length} open`}
            action={
              <Button variant="ghost" icon="add" onClick={openCreate}>
                Quick add
              </Button>
            }
          />

          {loading ? (
            <p className="px-space-lg py-space-xl font-body-sm text-body-sm text-on-surface-variant/50">
              Loading tasks…
            </p>
          ) : openTasks.length === 0 ? (
            <EmptyState
              icon="task_alt"
              title="Nothing outstanding"
              description="Tasks from your to-do and table pages show up here."
            />
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  {["Task name", "Page", "Due", "Priority"].map((heading) => (
                    <th
                      key={heading}
                      className="px-space-xl py-space-base text-left font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {openTasks.map((task, index) => (
                  <tr
                    key={`${task.file}-${index}`}
                    onClick={() => navigate(`/pages/${encodeURIComponent(task.file)}`)}
                    className="border-b border-outline-variant/15 hover:bg-surface-container-low/40 transition-colors cursor-pointer"
                  >
                    <td className="px-space-xl py-space-base font-body-sm text-body-sm text-on-surface truncate max-w-xs">
                      {task.label}
                    </td>
                    <td className="px-space-xl py-space-base font-body-sm text-body-sm text-on-surface-variant/70">
                      {task.source}
                    </td>
                    <td className="px-space-xl py-space-base font-body-sm text-body-sm">
                      {task.due ? (
                        <span className={isOverdue(task.due) ? "text-error" : "text-on-surface-variant/70"}>
                          {formatDate(task.due)}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/30">—</span>
                      )}
                    </td>
                    <td className="px-space-xl py-space-base">
                      {task.priority ? (
                        <span
                          className={cn(
                            "px-space-sm py-space-2xs rounded-full font-label-sm text-label-sm",
                            pillClass(task.priority),
                          )}
                        >
                          {task.priority}
                        </span>
                      ) : (
                        <span className="text-on-surface-variant/30">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="px-space-xl py-space-lg border-t border-outline-variant/30">
            <div className="flex items-center justify-between mb-space-xs">
              <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
                Overall progress
              </span>
              <span className="font-mono-badge text-mono-badge text-on-surface-variant">
                {stats.completionRate}%
              </span>
            </div>
            <ProgressBar value={stats.completionRate} />
          </div>
        </Panel>

        <div className="flex flex-col gap-space-xl">
          <FocusPanel
            personal={personal}
            onToggleGoal={(id) =>
              savePersonal({
                goals: personal.goals.map((goal) =>
                  goal.id === id ? { ...goal, done: !goal.done } : goal,
                ),
              })
            }
          />
          <QuickNotes />
          <ActivityFeed dataFiles={dataFiles} />
        </div>
      </div>
    </div>
  );
}
