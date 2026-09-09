import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { PageHeader } from "../ui/PageHeader";
import { Panel, PanelHeader } from "../ui/Panel";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { StatTile } from "../ui/StatTile";
import { EmptyState } from "../ui/EmptyState";
import { Field, TextInput } from "../ui/Field";
import { cn } from "../lib/cn";
import { DOCUMENT_META, DOCUMENT_TYPES, iconForType } from "../features/documents/documentMeta";
import type { DocumentType } from "../types";

export function SharedResourcesPage() {
  const { pathname } = useLocation();
  const { dataFiles, openCreate } = useWorkspace();
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<DocumentType | "all">("all");

  const isEngineeringHub = pathname.endsWith("/engineering");

  const results = useMemo(
    () =>
      dataFiles.filter((entry) => {
        const matchesType = typeFilter === "all" || entry.data?.type === typeFilter;
        const matchesQuery = entry.name.toLowerCase().includes(query.toLowerCase());
        return matchesType && matchesQuery;
      }),
    [dataFiles, query, typeFilter],
  );

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of dataFiles) {
      const type = entry.data?.type ?? "unknown";
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
    return counts;
  }, [dataFiles]);

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        icon={isEngineeringHub ? "engineering" : "folder_shared"}
        eyebrow={<Badge tone="primary">Team wiki</Badge>}
        title={isEngineeringHub ? "Engineering Hub" : "Shared Resources"}
        description="Central repository of workspace pages, guidelines, handbooks and operational wikis."
        actions={
          <Button variant="primary" icon="add" onClick={openCreate}>
            New Shared Page
          </Button>
        }
      />

      <div className="grid gap-space-xl sm:grid-cols-2 xl:grid-cols-4 mb-space-3xl">
        <StatTile label="Total Pages" value={String(dataFiles.length)} icon="folder" />
        <StatTile
          label="Page Types"
          value={String(typeCounts.size)}
          icon="category"
          iconClassName="text-tertiary"
        />
        <StatTile
          label="Documents"
          value={String(typeCounts.get("document") ?? 0)}
          icon="description"
        />
        <StatTile
          label="Boards"
          value={String(typeCounts.get("board") ?? 0)}
          icon="view_kanban"
          iconClassName="text-secondary"
        />
      </div>

      <Panel className="mb-space-lg">
        <div className="flex flex-wrap items-end gap-space-lg px-space-lg py-space-lg">
          <div className="flex-1 min-w-60">
            <Field label="Search resources">
              <TextInput
                value={query}
                placeholder="Search shared documents, templates, assets…"
                onChange={(event) => setQuery(event.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-wrap gap-space-xs">
            <FilterChip
              active={typeFilter === "all"}
              onClick={() => setTypeFilter("all")}
              label="All"
            />
            {DOCUMENT_TYPES.map((type) => (
              <FilterChip
                key={type}
                active={typeFilter === type}
                onClick={() => setTypeFilter(type)}
                label={DOCUMENT_META[type].label}
              />
            ))}
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          icon="grid_view"
          title="Pinned & recent"
          count={`${results.length} references`}
        />

        {results.length === 0 ? (
          <EmptyState
            icon="folder_off"
            title="Nothing matches that filter"
            description="Try a different search term or page type."
          />
        ) : (
          <div className="grid gap-space-lg p-space-xl md:grid-cols-2 xl:grid-cols-3">
            {results.map((entry) => (
              <Link
                key={entry.file}
                to={`/pages/${encodeURIComponent(entry.file)}`}
                className="rounded-xl border border-outline-variant/40 bg-surface-container-low/40 p-space-lg hover:border-outline-variant transition-colors"
              >
                <div className="flex items-center justify-between mb-space-base">
                  <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center">
                    <Icon name={iconForType(entry.data?.type)} size={18} className="text-primary" />
                  </div>
                  <Badge>{DOCUMENT_META[entry.data?.type as DocumentType]?.label ?? "Page"}</Badge>
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
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-space-base py-space-xs rounded-lg font-label-md text-label-md transition-colors",
        active
          ? "bg-primary-container text-on-primary"
          : "border border-outline-variant/50 text-on-surface-variant hover:border-outline",
      )}
    >
      {label}
    </button>
  );
}
