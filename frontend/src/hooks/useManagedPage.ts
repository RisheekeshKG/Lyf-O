import { useCallback, useEffect, useRef, useState } from "react";
import { useWorkspace } from "../context/WorkspaceContext";

/**
 * Binds a fixed workspace page (Work Tasks, Roadmap, Weekly Notes) to a real file
 * on disk, seeding it the first time it is opened.
 */
export function useManagedPage(file: string, seed: () => any) {
  const { dataFiles, loading, createFile, updateFile } = useWorkspace();
  const [seeding, setSeeding] = useState(false);
  const seedAttempted = useRef(false);

  const entry = dataFiles.find((item) => item.file === file);

  useEffect(() => {
    if (loading || entry || seedAttempted.current) return;
    seedAttempted.current = true;
    setSeeding(true);
    createFile(seed())
      .catch((error) => console.error(`Failed seeding ${file}`, error))
      .finally(() => setSeeding(false));
  }, [loading, entry, createFile, seed]);

  const update = useCallback((next: any) => updateFile(file, next), [file, updateFile]);

  return { data: entry?.data ?? null, loading: loading || seeding, update };
}
