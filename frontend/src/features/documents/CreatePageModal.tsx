import { useState } from "react";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { Field, TextInput } from "../../ui/Field";
import { Icon } from "../../ui/Icon";
import { cn } from "../../lib/cn";
import { DOCUMENT_META, DOCUMENT_TYPES } from "./documentMeta";
import { templateFor } from "./documentTemplates";
import type { DocumentType } from "../../types";

interface CreatePageModalProps {
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}

export function CreatePageModal({ onClose, onCreate }: CreatePageModalProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<DocumentType>("table");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await onCreate(templateFor(type, name.trim()));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Create New Page"
      onClose={onClose}
      className="max-w-md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" icon="add" onClick={submit} disabled={!name.trim() || saving}>
            {saving ? "Creating…" : "Create Page"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-space-lg">
        <Field label="Page name">
          <TextInput
            autoFocus
            value={name}
            placeholder="Sprint retrospective"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && submit()}
          />
        </Field>

        <div>
          <span className="block mb-space-sm font-label-md text-label-md text-on-surface-variant">
            Page type
          </span>
          <div className="grid grid-cols-2 gap-space-sm">
            {DOCUMENT_TYPES.map((option) => (
              <button
                key={option}
                onClick={() => setType(option)}
                className={cn(
                  "flex items-center gap-space-sm px-space-base py-space-sm rounded-lg border transition-colors font-body-sm text-body-sm",
                  type === option
                    ? "border-primary-container bg-primary-container/15 text-on-surface"
                    : "border-outline-variant/50 text-on-surface-variant hover:border-outline",
                )}
              >
                <Icon name={DOCUMENT_META[option].icon} size={16} />
                {DOCUMENT_META[option].label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
