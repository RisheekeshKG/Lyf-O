import { useParams } from "react-router-dom";
import { useWorkspace } from "../context/WorkspaceContext";
import { PageHeader } from "../ui/PageHeader";
import { EmptyState } from "../ui/EmptyState";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { DocumentRenderer } from "../features/documents/DocumentRenderer";
import { DOCUMENT_META, iconForType } from "../features/documents/documentMeta";
import type { DocumentType } from "../types";

export function DocumentPage() {
  const { file } = useParams<{ file: string }>();
  const { dataFiles, loading, updateFile, requestDelete, openCreate } = useWorkspace();

  const entry = dataFiles.find((item) => item.file === decodeURIComponent(file ?? ""));

  if (loading) {
    return (
      <div className="px-space-4xl py-space-3xl">
        <p className="font-body-md text-body-md text-on-surface-variant/60">Loading page…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="px-space-4xl py-space-3xl">
        <EmptyState
          icon="draft"
          title="Page not found"
          description="This file is no longer in your local datastore."
          action={
            <Button variant="primary" icon="add" onClick={openCreate}>
              Create a page
            </Button>
          }
        />
      </div>
    );
  }

  const type = entry.data?.type as DocumentType;

  return (
    <div className="px-space-4xl py-space-3xl">
      <PageHeader
        icon={iconForType(type)}
        title={entry.name}
        eyebrow={
          <>
            <Badge tone="primary">{DOCUMENT_META[type]?.label ?? "Page"}</Badge>
            {entry.modified && (
              <span className="font-label-sm text-label-sm text-on-surface-variant/50">
                Edited {new Date(entry.modified).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </>
        }
        actions={
          <Button variant="outline" icon="delete" onClick={() => requestDelete(entry.file)}>
            Delete
          </Button>
        }
      />

      <DocumentRenderer
        data={entry.data}
        onChange={(next) => updateFile(entry.file, next)}
      />
    </div>
  );
}
