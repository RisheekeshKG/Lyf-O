import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import { Icon } from "../ui/Icon";
import { Avatar } from "../ui/Avatar";
import { SidebarNavLink } from "./SidebarNavLink";
import { SidebarSection } from "./SidebarSection";
import { iconForType } from "../features/documents/documentMeta";
import type { DataFile } from "../types";

interface SidebarProps {
  dataFiles: DataFile[];
  workspaceName: string;
  userName: string;
  userSubtitle: string;
  pageCount: number;
  onCreateFile: () => void;
  onDeleteFile: (file: string) => void;
  onOpenSearch: () => void;
}

export function Sidebar({
  dataFiles,
  workspaceName,
  userName,
  userSubtitle,
  pageCount,
  onCreateFile,
  onDeleteFile,
  onOpenSearch,
}: SidebarProps) {
  return (
    <aside className="fixed left-0 top-titlebar-height bottom-0 w-sidebar-width bg-surface-container-lowest flex flex-col justify-between border-r border-outline-variant/20 z-40">
      <div className="flex flex-col flex-1 overflow-y-auto px-space-base pt-space-lg">
        <div className="flex items-center justify-between p-space-base mb-space-base rounded-lg bg-surface-container-low/60 hover:bg-surface-container-low transition-colors cursor-pointer">
          <div className="flex items-center gap-space-sm min-w-0">
            <div className="w-6 h-6 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container font-headline-sm text-headline-sm uppercase">
              {workspaceName.charAt(0) || "L"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
                {workspaceName}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant/70 truncate">
                {pageCount} {pageCount === 1 ? "page" : "pages"}
              </span>
            </div>
          </div>
          <Icon name="unfold_more" size={16} className="text-on-surface-variant" />
        </div>

        <div className="mb-space-lg">
          <button
            onClick={onOpenSearch}
            className="w-full flex items-center justify-between px-space-base py-space-sm rounded-lg bg-surface-container-low text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <div className="flex items-center gap-space-sm">
              <Icon name="search" size={16} />
              <span className="font-body-sm text-body-sm">Quick Search</span>
            </div>
            <span className="px-space-xs py-space-2xs rounded bg-surface-container-high text-on-surface-variant font-mono-badge text-mono-badge">
              ⌘K
            </span>
          </button>
        </div>

        <nav className="flex flex-col gap-space-2xs mb-space-lg">
          <SidebarNavLink to="/" icon="home" label="Home" end />
          <SidebarNavLink
            to="/assistant"
            icon="auto_awesome"
            label="AI Assistant"
            iconClassName="text-tertiary"
          />
          <SidebarNavLink to="/inbox" icon="inbox" label="Inbox" />
          <SidebarNavLink to="/recommend" icon="star" label="Recommend" />
        </nav>

        <SidebarSection title="Workspace">
          <SidebarNavLink to="/tasks" icon="view_kanban" label="Work Tasks" />
          <SidebarNavLink to="/roadmap" icon="rocket_launch" label="Product Roadmap" />
          <SidebarNavLink to="/notes" icon="edit_note" label="Weekly Notes" />
        </SidebarSection>

        <SidebarSection title="Private" onAdd={onCreateFile} addLabel="Create new page">
          {dataFiles.length === 0 ? (
            <p className="px-space-base py-space-sm font-body-sm text-body-sm text-on-surface-variant/40">
              No pages yet
            </p>
          ) : (
            dataFiles.map((entry) => (
              <DataFileLink key={entry.file} entry={entry} onDelete={onDeleteFile} />
            ))
          )}
        </SidebarSection>

        <SidebarSection title="Shared">
          <SidebarNavLink to="/resources" icon="folder_shared" label="Shared Resources" />
          <SidebarNavLink to="/resources/engineering" icon="engineering" label="Engineering Hub" />
        </SidebarSection>
      </div>

      <div className="p-space-base bg-surface-container-lowest/80 flex flex-col gap-space-xs shadow-[0_-1px_6px_rgba(0,0,0,0.15)]">
        <div className="flex items-center justify-between p-space-base rounded-lg hover:bg-surface-container-low transition-colors cursor-pointer">
          <div className="flex items-center gap-space-sm min-w-0">
            <Avatar name={userName} size={24} />
            <div className="flex flex-col min-w-0">
              <span className="font-body-sm text-body-sm text-on-surface truncate leading-tight">
                {userName}
              </span>
              <span className="font-label-sm text-label-sm text-on-surface-variant/60 truncate">
                {userSubtitle}
              </span>
            </div>
          </div>
          <Icon name="expand_more" size={16} className="text-on-surface-variant" />
        </div>

        <SidebarNavLink to="/settings" icon="settings" label="Settings" />
      </div>
    </aside>
  );
}

function DataFileLink({
  entry,
  onDelete,
}: {
  entry: DataFile;
  onDelete: (file: string) => void;
}) {
  return (
    <div className="group relative">
      <NavLink
        to={`/pages/${encodeURIComponent(entry.file)}`}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-space-base px-space-base py-space-sm pr-8 rounded-lg transition-colors",
            isActive
              ? "bg-surface-container text-on-surface"
              : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
          )
        }
      >
        <Icon name={iconForType(entry.data?.type)} size={16} />
        <span className="font-body-sm text-body-sm truncate">{entry.name}</span>
      </NavLink>

      <button
        onClick={(event) => {
          event.preventDefault();
          onDelete(entry.file);
        }}
        aria-label={`Delete ${entry.name}`}
        title={`Delete ${entry.name}`}
        className="absolute right-space-xs top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error"
      >
        <Icon name="delete" size={14} />
      </button>
    </div>
  );
}
