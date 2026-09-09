import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { useRecommendations } from "../hooks/useRecommendations";
import { PageHeader } from "../ui/PageHeader";
import { Panel, PanelHeader } from "../ui/Panel";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Icon } from "../ui/Icon";
import { EmptyState } from "../ui/EmptyState";
import { iconForType } from "../features/documents/documentMeta";
import { focusScore } from "../features/profile/personalization";

export function RecommendPage() {
  const { profile, personal, createFile } = useWorkspace();
  const navigate = useNavigate();
  const { items, cluster, status, loading, fetchRecommendations, enhance, setStatus } =
    useRecommendations(profile);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // Templates touching a chosen focus area surface first.
  const ranked = useMemo(() => {
    if (personal.focusAreas.length === 0) return items;
    return [...items].sort(
      (a, b) =>
        focusScore(b.name, personal.focusAreas) - focusScore(a.name, personal.focusAreas),
    );
  }, [items, personal.focusAreas]);

  const save = async (item: any) => {
    const file = await createFile(item);
    setStatus(`Saved "${item.name}" to your workspace`);
    navigate(`/pages/${encodeURIComponent(file)}`);
  };

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        icon="star"
        eyebrow={
          <>
            {cluster !== null && <Badge tone="primary">Matched to your profile</Badge>}
            {status && (
              <span className="font-mono-badge text-mono-badge text-on-surface-variant/40">
                {status}
              </span>
            )}
          </>
        }
        title="Recommended for you"
        description="Ready-made pages picked for how you actually spend your time."
        actions={
          <>
            <Button variant="outline" icon="person" onClick={() => navigate("/profile")}>
              {profile ? "Edit profile" : "Add profile"}
            </Button>
            <Button
              variant="primary"
              icon="refresh"
              onClick={fetchRecommendations}
              disabled={loading}
            >
              {loading ? "Fetching…" : "Refresh"}
            </Button>
          </>
        }
      />

      {!profile && (
        <Panel className="mb-space-lg">
          <div className="flex items-center gap-space-base px-space-lg py-space-base">
            <Icon name="info" size={18} className="text-secondary shrink-0" />
            <p className="flex-1 font-body-sm text-body-sm text-on-surface-variant/80">
              You're seeing general suggestions. Tell us about yourself for picks that fit you.
            </p>
            <Button variant="secondary" onClick={() => navigate("/profile")}>
              Add profile
            </Button>
          </div>
        </Panel>
      )}

      {loading ? (
        <Panel>
          <EmptyState icon="progress_activity" title="Matching templates to your profile…" />
        </Panel>
      ) : items.length === 0 ? (
        <Panel>
          <EmptyState
            icon="star"
            title="No recommendations yet"
            description="We couldn't reach the suggestion service. Try again in a moment."
            action={
              <Button variant="primary" icon="refresh" onClick={fetchRecommendations}>
                Try again
              </Button>
            }
          />
        </Panel>
      ) : (
        <div className="grid gap-space-xl xl:grid-cols-3 md:grid-cols-2">
          {ranked.map((item) => (
            <Panel key={item.name} className="flex flex-col">
              <PanelHeader
                icon={iconForType(item.type)}
                title={item.name}
                action={<Badge tone="primary">{item.type}</Badge>}
              />

              <div className="flex-1 px-space-lg py-space-base">
                <TemplatePreview item={item} />
              </div>

              <footer className="flex items-center gap-space-sm px-space-lg py-space-base border-t border-outline-variant/30">
                <Button variant="primary" icon="bookmark_add" onClick={() => save(item)}>
                  Save
                </Button>
                <Button variant="outline" icon="auto_awesome" onClick={() => enhance(item)}>
                  Enhance
                </Button>
              </footer>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

function TemplatePreview({ item }: { item: any }) {
  if (Array.isArray(item.items)) {
    return (
      <ul className="flex flex-col gap-space-xs">
        {item.items.slice(0, 5).map((entry: any, index: number) => (
          <li
            key={index}
            className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface-variant/70"
          >
            <Icon name="check_box_outline_blank" size={14} className="shrink-0" />
            <span className="truncate">{entry.task ?? entry.name ?? String(entry)}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (Array.isArray(item.columns)) {
    return (
      <div className="flex flex-wrap gap-space-xs">
        {item.columns.slice(0, 6).map((column: any, index: number) => (
          <Badge key={index}>{column.name ?? String(column)}</Badge>
        ))}
      </div>
    );
  }

  if (typeof item.content === "string") {
    return (
      <p className="font-body-sm text-body-sm text-on-surface-variant/70 line-clamp-4">
        {item.content}
      </p>
    );
  }

  return (
    <p className="font-body-sm text-body-sm text-on-surface-variant/40">
      Template ready to save.
    </p>
  );
}
