import { useMemo } from "react";
import { useManagedPage } from "../hooks/useManagedPage";
import { PageHeader } from "../ui/PageHeader";
import { Badge } from "../ui/Badge";
import { ProgressBar } from "../ui/ProgressBar";
import { EmptyState } from "../ui/EmptyState";
import { DocumentRenderer } from "../features/documents/DocumentRenderer";
import { seedWorkTasks, WORK_TASKS_FILE } from "../features/workspace/seeds";
import { summarizePage } from "../features/workspace/pageSummary";
import { DOCUMENT_META } from "../features/documents/documentMeta";
import type { DocumentType } from "../types";

export function WorkTasksPage() {
  const { data, loading, update } = useManagedPage(WORK_TASKS_FILE, seedWorkTasks);
  const summary = useMemo(() => summarizePage(data), [data]);

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        icon="view_kanban"
        eyebrow={
          <>
            <Badge tone="tertiary">Sprint active</Badge>
            {data && (
              <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
                {DOCUMENT_META[data.type as DocumentType]?.label ?? data.type} ·{" "}
                {summary.total} items
              </span>
            )}
          </>
        }
        title="Work Tasks"
        description="Sprint board tracking cross-functional engineering and design backlog."
      />

      {summary.total > 0 && (
        <div className="mb-space-3xl max-w-md">
          <div className="flex items-center justify-between mb-space-xs">
            <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
              Completion
            </span>
            <span className="font-mono-badge text-mono-badge text-on-surface-variant">
              {summary.done}/{summary.total}
            </span>
          </div>
          <ProgressBar value={summary.done} max={summary.total} />
        </div>
      )}

      {loading ? (
        <EmptyState icon="progress_activity" title="Loading board…" />
      ) : data ? (
        <DocumentRenderer data={data} onChange={update} />
      ) : (
        <EmptyState icon="view_kanban" title="Board unavailable" />
      )}
    </div>
  );
}
