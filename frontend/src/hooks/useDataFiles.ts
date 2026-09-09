import { useCallback, useEffect, useState } from "react";
import { invoke, waitForElectronAPI } from "../lib/electron";
import { toFileName } from "../lib/slug";
import { SCHEMA_VERSION } from "../features/documents/documentTemplates";
import type { DataFile } from "../types";

export function useDataFiles() {
  const [dataFiles, setDataFiles] = useState<DataFile[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const available = await waitForElectronAPI();
    if (!available) {
      console.warn("electronAPI not found — data files unavailable");
      setLoading(false);
      return;
    }

    try {
      // statDir gives modification times so "recent" is real; fall back for older builds.
      let entries: { name: string; modified: number }[];
      try {
        entries = await invoke<{ name: string; modified: number }[]>("statDir");
      } catch {
        const names: string[] = await invoke("readDir");
        entries = names.map((name) => ({ name, modified: 0 }));
      }

      const loaded: DataFile[] = [];

      for (const entry of entries.filter((item) => item.name.endsWith(".json"))) {
        try {
          const raw = await invoke("readFile", entry.name);
          if (!raw) continue;
          const data = typeof raw === "string" ? JSON.parse(raw) : raw;
          loaded.push({
            name: data.name || entry.name.replace(".json", ""),
            file: entry.name,
            data,
            modified: entry.modified,
          });
        } catch (error) {
          console.error(`Failed reading ${entry.name}`, error);
        }
      }

      loaded.sort((a, b) => (b.modified ?? 0) - (a.modified ?? 0));
      setDataFiles(loaded);
    } catch (error) {
      console.error("Failed listing data directory", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const writeFile = useCallback(async (file: string, data: any) => {
    // Keep the canonical envelope intact on every save (see documentTemplates.ts).
    const stamped = { ...data, schemaVersion: data.schemaVersion ?? SCHEMA_VERSION, updatedAt: new Date().toISOString() };
    await invoke("writeFile", file, JSON.stringify(stamped, null, 2));
  }, []);

  const updateFile = useCallback(
    async (file: string, data: any) => {
      setDataFiles((current) =>
        current.map((entry) =>
          entry.file === file ? { ...entry, name: data.name ?? entry.name, data } : entry,
        ),
      );
      await writeFile(file, data);
    },
    [writeFile],
  );

  const createFile = useCallback(
    async (data: any) => {
      const file = toFileName(data.name);
      await writeFile(file, data);
      await reload();
      return file;
    },
    [reload, writeFile],
  );

  const deleteFile = useCallback(async (file: string) => {
    const result = await invoke<{ success?: boolean }>("deleteFile", file);
    if (result?.success) {
      setDataFiles((current) => current.filter((entry) => entry.file !== file));
    }
    return Boolean(result?.success);
  }, []);

  return { dataFiles, loading, reload, createFile, updateFile, deleteFile };
}
