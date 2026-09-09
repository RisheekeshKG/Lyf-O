import { Link } from "react-router-dom";
import { Panel, PanelHeader } from "../../ui/Panel";
import { Icon } from "../../ui/Icon";
import { EmptyState } from "../../ui/EmptyState";
import { iconForType } from "../documents/documentMeta";
import { summarizePage } from "../workspace/pageSummary";
import { MANAGED_FILES } from "../workspace/seeds";
import type { DataFile } from "../../types";

const ROUTE_FOR_MANAGED: Record<string, string> = {
  "work_tasks.json": "/tasks",
  "product_roadmap.json": "/roadmap",
  "weekly_notes.json": "/notes",
};

function relativeTime(epoch?: number): string {
  if (!epoch) return "—";

  const minutes = Math.round((Date.now() - epoch) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.round(minutes / 60)}h ago`;
  return `${Math.round(minutes / 1440)}d ago`;
}

/** Real workspace activity: what changed on disk, most recent first. */
export function ActivityFeed({ dataFiles }: { dataFiles: DataFile[] }) {
  const recent = dataFiles.filter((entry) => entry.modified).slice(0, 6);

  return (
    <Panel>
      <PanelHeader icon="bolt" title="Workspace Activity" count={`${dataFiles.length} pages`} />

      {recent.length === 0 ? (
        <EmptyState
          icon="history"
          title="No activity yet"
          description="Edits to your pages show up here."
        />
      ) : (
        <ul>
          {recent.map((entry) => {
            const summary = summarizePage(entry.data);
            const to = MANAGED_FILES.has(entry.file)
              ? ROUTE_FOR_MANAGED[entry.file]
              : `/pages/${encodeURIComponent(entry.file)}`;

            return (
              <li key={entry.file}>
                <Link
                  to={to}
                  className="flex items-center gap-space-base px-space-xl py-space-lg border-b border-outline-variant/15 last:border-0 hover:bg-surface-container-low/40 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center shrink-0">
                    <Icon
                      name={iconForType(entry.data?.type)}
                      size={16}
                      className="text-on-surface-variant"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-headline-sm text-headline-sm text-on-surface truncate">
                      {entry.name}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant/60">
                      {summary.total > 0
                        ? `${summary.done}/${summary.total} complete`
                        : `${entry.data?.type ?? "page"} updated`}
                    </p>
                  </div>

                  <span className="font-mono-badge text-mono-badge text-on-surface-variant/40 shrink-0">
                    {relativeTime(entry.modified)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}
