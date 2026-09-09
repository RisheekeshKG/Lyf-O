import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { TitleBar } from "./TitleBar";
import { Sidebar } from "./Sidebar";
import { useWorkspace } from "../context/WorkspaceContext";
import { CreatePageModal } from "../features/documents/CreatePageModal";
import { DeletePageModal } from "../features/documents/DeletePageModal";
import { MANAGED_FILES } from "../features/workspace/seeds";
import { CommandPalette } from "../features/search/CommandPalette";

const CRUMBS: Record<string, string> = {
  "/": "Home",
  "/assistant": "AI Assistant",
  "/inbox": "Inbox",
  "/recommend": "Recommend",
  "/tasks": "Work Tasks",
  "/roadmap": "Product Roadmap",
  "/notes": "Weekly Notes",
  "/resources": "Shared Resources",
  "/resources/engineering": "Engineering Hub",
  "/settings": "Settings",
  "/profile": "Profile",
};

export function AppShell() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    dataFiles,
    profile,
    openCreate,
    requestDelete,
    createFile,
    deleteFile,
    reload,
    isCreateOpen,
    closeCreate,
    pendingDelete,
    cancelDelete,
    isSearchOpen,
    openSearch,
    closeSearch,
    settings,
    personal,
    needsProfile,
  } = useWorkspace();

  // Send first-run users to the profile once — the whole app keys off it.
  const sentToProfile = useRef(false);
  useEffect(() => {
    if (needsProfile && !sentToProfile.current) {
      sentToProfile.current = true;
      navigate("/profile");
    }
  }, [needsProfile, navigate]);

  const activeFile = pathname.startsWith("/pages/")
    ? dataFiles.find((entry) => entry.file === decodeURIComponent(pathname.split("/pages/")[1]))
    : undefined;

  const pageName = activeFile?.name ?? CRUMBS[pathname] ?? "Workspace";
  const pageCount = dataFiles.length;

  return (
    <div className="min-h-screen bg-surface text-on-surface font-body-md text-body-md antialiased">
      <TitleBar
        breadcrumbs={[settings.workspaceName, pageName]}
        onOpenProfile={() => navigate("/profile")}
        onOpenSearch={openSearch}
      />

      <Sidebar
        dataFiles={dataFiles.filter((entry) => !MANAGED_FILES.has(entry.file))}
        workspaceName={settings.workspaceName}
        userName={personal.name.trim() || "You"}
        userSubtitle={profile?.occupation ?? "Personal workspace"}
        pageCount={pageCount}
        onCreateFile={openCreate}
        onDeleteFile={requestDelete}
        onOpenSearch={openSearch}
      />

      <main className="pl-sidebar-width pt-titlebar-height min-h-screen">
        <Outlet />
      </main>

      {isSearchOpen && <CommandPalette onClose={closeSearch} />}

      {isCreateOpen && (
        <CreatePageModal
          onClose={closeCreate}
          onCreate={async (data) => {
            await createFile(data);
            closeCreate();
          }}
        />
      )}

      {pendingDelete && (
        <DeletePageModal
          pageName={
            dataFiles.find((entry) => entry.file === pendingDelete)?.name ?? "this page"
          }
          onCancel={cancelDelete}
          onConfirm={async () => {
            await deleteFile(pendingDelete);
            await reload();
            cancelDelete();
          }}
        />
      )}
    </div>
  );
}
