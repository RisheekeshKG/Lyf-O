import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "../../../ui/Button";
import { Panel } from "../../../ui/Panel";
import type { ViewProps } from "./types";

export function MarkdownView({ data, onChange }: ViewProps) {
  const [preview, setPreview] = useState(true);
  const content: string = data.content ?? "";

  return (
    <Panel>
      <header className="flex items-center justify-between px-space-lg py-space-base border-b border-outline-variant/30">
        <span className="font-mono-badge text-mono-badge uppercase tracking-wider text-on-surface-variant/50">
          {preview ? "Reading" : "Editing"}
        </span>
        <Button
          variant="ghost"
          icon={preview ? "edit" : "visibility"}
          onClick={() => setPreview((current) => !current)}
        >
          {preview ? "Edit" : "Preview"}
        </Button>
      </header>

      <div className="px-space-2xl py-space-xl">
        {preview ? (
          <article className="selectable prose prose-invert max-w-none prose-headings:font-headline-lg prose-p:text-on-surface-variant prose-a:text-primary prose-strong:text-on-surface prose-code:text-tertiary">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content || "_Nothing here yet…_"}
            </ReactMarkdown>
          </article>
        ) : (
          <textarea
            autoFocus
            value={content}
            onChange={(event) =>
              onChange({ ...data, content: event.target.value, lastEdited: new Date().toISOString() })
            }
            placeholder="Write using Markdown syntax…"
            className="w-full min-h-[60vh] bg-transparent text-on-surface-variant outline-none resize-none font-mono-code text-mono-code"
          />
        )}
      </div>
    </Panel>
  );
}
