import { useManagedPage } from "../hooks/useManagedPage";
import { PageHeader } from "../ui/PageHeader";
import { Badge } from "../ui/Badge";
import { EmptyState } from "../ui/EmptyState";
import { DocumentRenderer } from "../features/documents/DocumentRenderer";
import { seedWeeklyNotes, WEEKLY_NOTES_FILE } from "../features/workspace/seeds";

export function WeeklyNotesPage() {
  const { data, loading, update } = useManagedPage(WEEKLY_NOTES_FILE, seedWeeklyNotes);

  const edited = data?.lastEdited ? new Date(data.lastEdited) : null;

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        icon="edit_note"
        eyebrow={
          <>
            <Badge tone="secondary">Sprint retrospective</Badge>
            {edited && (
              <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
                Edited {edited.toLocaleDateString()}
              </span>
            )}
          </>
        }
        title="Weekly Notes"
        description="Running retrospective — summary, accomplishments, blockers and decisions."
      />

      <div className="max-w-4xl">
        {loading ? (
          <EmptyState icon="progress_activity" title="Loading notes…" />
        ) : data ? (
          <DocumentRenderer data={data} onChange={update} />
        ) : (
          <EmptyState icon="edit_note" title="Notes unavailable" />
        )}
      </div>
    </div>
  );
}
