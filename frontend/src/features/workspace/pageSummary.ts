export interface PageSummary {
  total: number;
  done: number;
}

const DONE = /done|complete|shipped|closed/i;

/** Fixed pages accept whichever shape is already on disk, so counts must too. */
export function summarizePage(data: any): PageSummary {
  if (!data) return { total: 0, done: 0 };

  if (data.type === "board") {
    const columns: any[] = data.columns ?? [];
    let total = 0;
    let done = 0;
    for (const column of columns) {
      const count = (column.tasks ?? column.cards ?? []).length;
      total += count;
      if (DONE.test(column.name ?? "")) done += count;
    }
    return { total, done };
  }

  if (data.type === "table") {
    const columns: any[] = data.columns ?? [];
    const rows: any[][] = data.values ?? [];
    const statusIndex = columns.findIndex((column) => /status|state/i.test(column.name));
    const populated = rows.filter((row) => row.some((cell) => String(cell ?? "").trim()));
    return {
      total: populated.length,
      done:
        statusIndex === -1
          ? 0
          : populated.filter((row) => DONE.test(row[statusIndex] ?? "")).length,
    };
  }

  if (data.type === "todolist") {
    const items: any[] = data.items ?? [];
    return { total: items.length, done: items.filter((item) => item.done).length };
  }

  return { total: 0, done: 0 };
}
