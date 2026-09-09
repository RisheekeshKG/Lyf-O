import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/Button";

interface TitleBarProps {
  breadcrumbs: string[];
  onOpenProfile: () => void;
  onOpenSearch: () => void;
}

/**
 * Immersive title bar. The window is frameless (`hiddenInset` on macOS), so the
 * OS paints its own traffic lights over the left edge — this reserves room for
 * them rather than drawing fakes, and the whole bar acts as the drag handle.
 */
export function TitleBar({ breadcrumbs, onOpenProfile, onOpenSearch }: TitleBarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-titlebar-height z-50 bg-surface-container-lowest/90 backdrop-blur-md flex items-center justify-between px-space-base border-b border-outline-variant/20 drag-region">
      <div className="w-sidebar-width shrink-0" />

      <nav className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;
          return (
            <span key={crumb} className="flex items-center gap-space-xs">
              <span className={isLast ? "text-on-surface font-medium" : ""}>{crumb}</span>
              {!isLast && <span className="text-on-surface-variant/40">/</span>}
            </span>
          );
        })}
      </nav>

      <div className="flex items-center gap-space-base no-drag">
        <div className="flex items-center gap-space-xs px-space-sm py-space-2xs rounded-lg bg-surface-container-low">
          <span className="w-2 h-2 rounded-full bg-tertiary" />
          <span className="font-label-sm text-label-sm text-on-surface-variant">
            All changes saved
          </span>
        </div>

        <div className="flex items-center gap-space-xs">
          <IconButton icon="search" label="Search (⌘K)" onClick={onOpenSearch} />
          <IconButton icon="notifications" label="Notifications" />
        </div>

        <button
          onClick={onOpenProfile}
          aria-label="Your profile"
          title="Your profile"
          className="w-8 h-8 rounded-full bg-primary flex items-center justify-center hover:brightness-110 transition"
        >
          <Icon name="person" size={18} className="text-on-primary" />
        </button>
      </div>
    </header>
  );
}
