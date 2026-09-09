import { useCallback, useEffect, useState } from "react";

export interface AppSettings {
  workspaceName: string;
  accent: string;
  density: "comfortable" | "compact";
}

const STORAGE_KEY = "workspace_settings";

export const DEFAULT_SETTINGS: AppSettings = {
  workspaceName: "lyf-O",
  accent: "#e07a5f",
  density: "comfortable",
};

function read(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

/** Accent overrides the token the whole design keys off, so the change is live. */
function applyAccent(accent: string) {
  document.documentElement.style.setProperty("--color-primary-container", accent);
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const stored = read();
    setSettings(stored);
    applyAccent(stored.accent);
  }, []);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((current) => {
      const next = { ...current, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable — keep the change for this session */
      }
      if (patch.accent) applyAccent(patch.accent);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setSettings(DEFAULT_SETTINGS);
    applyAccent(DEFAULT_SETTINGS.accent);
  }, []);

  return { settings, update, reset };
}
