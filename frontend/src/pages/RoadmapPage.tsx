import { useManagedPage } from "../hooks/useManagedPage";
import { PageHeader } from "../ui/PageHeader";
import { Badge } from "../ui/Badge";
import { StatTile } from "../ui/StatTile";
import { EmptyState } from "../ui/EmptyState";
import { DocumentRenderer } from "../features/documents/DocumentRenderer";
import { ROADMAP_FILE, seedRoadmap } from "../features/workspace/seeds";

export function RoadmapPage() {
  const { data, loading, update } = useManagedPage(ROADMAP_FILE, seedRoadmap);

  const rows: any[][] = data?.values ?? [];
  const columns: any[] = data?.columns ?? [];
  const statusIndex = columns.findIndex((column) => /status/i.test(column.name));

  const countOf = (pattern: RegExp) =>
    statusIndex === -1
      ? 0
      : rows.filter((row) => pattern.test(row[statusIndex] ?? "")).length;

  const shipped = countOf(/shipped/i);
  const inProgress = countOf(/progress/i);
  const blocked = countOf(/blocked/i);

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        icon="rocket_launch"
        eyebrow={
          <>
            <Badge tone="primary">Current quarter</Badge>
            <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
              {rows.length} milestones
            </span>
          </>
        }
        title="Product Roadmap"
        description="Strategic engineering milestones, design deliverables, and platform launch schedule."
      />

      <div className="grid gap-space-xl sm:grid-cols-2 xl:grid-cols-4 mb-space-3xl">
        <StatTile label="Milestones" value={String(rows.length)} icon="flag" />
        <StatTile
          label="In Progress"
          value={String(inProgress)}
          icon="pending"
          iconClassName="text-secondary"
        />
        <StatTile
          label="Shipped"
          value={String(shipped)}
          icon="check_circle"
          iconClassName="text-tertiary"
        />
        <StatTile
          label="Blocked"
          value={String(blocked)}
          icon="report"
          iconClassName="text-error"
        />
      </div>

      {loading ? (
        <EmptyState icon="progress_activity" title="Loading roadmap…" />
      ) : data ? (
        <DocumentRenderer data={data} onChange={update} />
      ) : (
        <EmptyState icon="rocket_launch" title="Roadmap unavailable" />
      )}
    </div>
  );
}
