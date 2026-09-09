import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useDataFiles } from "../hooks/useDataFiles";
import { useProfile } from "../hooks/useProfile";
import { useAppSettings, type AppSettings } from "../hooks/useAppSettings";
import type { DataFile, PersonalProfile, UserProfile } from "../types";

interface WorkspaceValue {
  dataFiles: DataFile[];
  loading: boolean;
  reload: () => Promise<void>;
  createFile: (data: any) => Promise<string>;
  updateFile: (file: string, data: any) => Promise<void>;
  deleteFile: (file: string) => Promise<boolean>;

  profile: UserProfile | null;
  saveProfile: (profile: UserProfile) => void;
  personal: PersonalProfile;
  savePersonal: (patch: Partial<PersonalProfile>) => void;

  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetSettings: () => void;

  needsProfile: boolean;

  isCreateOpen: boolean;
  openCreate: () => void;
  closeCreate: () => void;

  pendingDelete: string | null;
  requestDelete: (file: string) => void;
  cancelDelete: () => void;

  isSearchOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

const WorkspaceContext = createContext<WorkspaceValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const files = useDataFiles();
  const { profile, personal, saveProfile, savePersonal, ready } = useProfile();
  const { settings, update: updateSettings, reset: resetSettings } = useAppSettings();

  const [needsProfile, setNeedsProfile] = useState(false);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  // First run has no profile; the page (not a modal) is where it gets filled in.
  useEffect(() => {
    if (ready && !profile) setNeedsProfile(true);
  }, [ready, profile]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((current) => !current);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const value = useMemo<WorkspaceValue>(
    () => ({
      ...files,
      profile,
      saveProfile,
      personal,
      savePersonal,
      settings,
      updateSettings,
      resetSettings,
      needsProfile,
      isCreateOpen,
      openCreate: () => setCreateOpen(true),
      closeCreate: () => setCreateOpen(false),
      pendingDelete,
      requestDelete: setPendingDelete,
      cancelDelete: () => setPendingDelete(null),
      isSearchOpen,
      openSearch: () => setSearchOpen(true),
      closeSearch: () => setSearchOpen(false),
    }),
    [
      files,
      profile,
      saveProfile,
      personal,
      savePersonal,
      settings,
      updateSettings,
      resetSettings,
      needsProfile,
      isCreateOpen,
      isSearchOpen,
      pendingDelete,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error("useWorkspace must be used inside a WorkspaceProvider");
  return context;
}
