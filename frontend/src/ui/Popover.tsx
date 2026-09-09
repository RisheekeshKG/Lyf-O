import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface PopoverProps {
  anchorRef: React.RefObject<HTMLElement>;
  onClose: () => void;
  align?: "left" | "right";
  width?: number;
  children: ReactNode;
}

/**
 * Portals to <body> so dropdowns aren't clipped by scroll containers
 * (tables and boards both sit inside `overflow-auto` wrappers).
 */
export function Popover({ anchorRef, onClose, align = "left", width = 224, children }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const place = () => {
      const rect = anchor.getBoundingClientRect();
      const height = panelRef.current?.offsetHeight ?? 240;

      // Flip above the anchor when there isn't room below.
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < height + 8 && rect.top > height ? rect.top - height - 4 : rect.bottom + 4;

      const rawLeft = align === "right" ? rect.right - width : rect.left;
      const left = Math.max(8, Math.min(rawLeft, window.innerWidth - width - 8));

      setPosition({ top, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [anchorRef, align, width]);

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [anchorRef, onClose]);

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: "fixed",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        width,
        visibility: position ? "visible" : "hidden",
      }}
      className="z-[200] rounded-xl border border-outline-variant/50 bg-surface-container-high shadow-2xl"
    >
      {children}
    </div>,
    document.body,
  );
}
