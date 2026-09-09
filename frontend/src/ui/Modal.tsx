import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { IconButton } from "./Button";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ title, onClose, children, footer, className }: ModalProps) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-space-lg">
      <div
        className={cn(
          "w-full max-w-modal-max-width rounded-xl border border-outline-variant/40 bg-surface-container shadow-2xl flex flex-col max-h-[85vh]",
          className,
        )}
      >
        <header className="flex items-center justify-between px-space-xl py-space-lg border-b border-outline-variant/30">
          <h2 className="font-headline-md text-headline-md text-on-surface">{title}</h2>
          <IconButton icon="close" label="Close" onClick={onClose} />
        </header>

        <div className="flex-1 overflow-y-auto px-space-xl py-space-lg">{children}</div>

        {footer && (
          <footer className="flex items-center justify-end gap-space-sm px-space-xl py-space-lg border-t border-outline-variant/30">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}
