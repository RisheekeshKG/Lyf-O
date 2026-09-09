import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { Icon } from "../../ui/Icon";

interface DeletePageModalProps {
  pageName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeletePageModal({ pageName, onConfirm, onCancel }: DeletePageModalProps) {
  return (
    <Modal
      title="Delete page"
      onClose={onCancel}
      className="max-w-sm"
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            icon="delete"
            onClick={onConfirm}
            className="bg-error-container text-on-error-container hover:brightness-110"
          >
            Delete
          </Button>
        </>
      }
    >
      <div className="flex gap-space-base">
        <Icon name="warning" size={20} className="text-error shrink-0" />
        <div>
          <p className="font-body-md text-body-md text-on-surface">
            Delete <span className="font-medium">{pageName}</span>?
          </p>
          <p className="mt-space-xs font-body-sm text-body-sm text-on-surface-variant/70">
            This page and everything in it will be removed. This can't be undone.
          </p>
        </div>
      </div>
    </Modal>
  );
}
