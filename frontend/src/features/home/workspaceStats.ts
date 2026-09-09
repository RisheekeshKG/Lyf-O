import type { DataFile } from "../../types";

export interface PriorityTask {
  label: string;
  source: string;
  file: string;
  done: boolean;
  due?: string;
  priority?: string;
}

export interface WorkspaceStats {
  pageCount: number;
  openTasks: number;
  completedTasks: number;
  totalTasks: number;
  completionRate: number;
  storageKb: number;
  priorityTasks: PriorityTask[];
}

/** Everything the dashboard reports is derived from the files on disk. */
export function deriveStats(dataFiles: DataFile[]): WorkspaceStats {
  const priorityTasks: PriorityTask[] = [];
  let storageBytes = 0;

  for (const entry of dataFiles) {
    storageBytes += JSON.stringify(entry.data).length;

    if (entry.data?.type === "todolist") {
      for (const item of entry.data.items ?? []) {
        if (!item.task) continue;
        priorityTasks.push({
          label: item.task,
          source: entry.name,
          file: entry.file,
          done: Boolean(item.done),
        });
      }
    }

    if (entry.data?.type === "table") {
      const columns: any[] = entry.data.columns ?? [];
      const taskIndex = columns.findIndex((column) => /task|name|title/i.test(column.name));
      const statusIndex = columns.findIndex((column) => /status|state/i.test(column.name));
      const dueIndex = columns.findIndex((column) => /due|date/i.test(column.name));
      const priorityIndex = columns.findIndex((column) => /priority/i.test(column.name));
      if (taskIndex === -1) continue;

      for (const row of entry.data.values ?? []) {
        const label = row[taskIndex];
        if (!label) continue;
        priorityTasks.push({
          label,
          source: entry.name,
          file: entry.file,
          done: /done|complete/i.test(statusIndex === -1 ? "" : row[statusIndex] ?? ""),
          due: dueIndex === -1 ? undefined : row[dueIndex],
          priority: priorityIndex === -1 ? undefined : row[priorityIndex],
        });
      }
    }
  }

  const completedTasks = priorityTasks.filter((task) => task.done).length;
  const totalTasks = priorityTasks.length;

  return {
    pageCount: dataFiles.length,
    openTasks: totalTasks - completedTasks,
    completedTasks,
    totalTasks,
    completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    storageKb: Math.round((storageBytes / 1024) * 10) / 10,
    priorityTasks,
  };
}

export function greetingFor(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
