import type { DocumentType } from "../../types";

/**
 * Canonical page shapes. These mirror `backend/schemas.py` exactly — a page
 * created here and a page created by the AI must be indistinguishable on disk.
 * If you change a shape, change it there too and bump SCHEMA_VERSION.
 */
export const SCHEMA_VERSION = 1;

const newId = (prefix: string) => `${prefix}-${Math.random().toString(16).slice(2, 10)}`;

export function templateFor(type: DocumentType, name: string): any {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  const base = { name, schemaVersion: SCHEMA_VERSION, createdAt: now, updatedAt: now };

  switch (type) {
    case "table":
      return {
        ...base,
        type,
        columns: [
          { name: "Task", type: "text" },
          { name: "Status", type: "options", options: ["To Do", "In Progress", "Done"] },
          { name: "Priority", type: "options", options: ["High", "Medium", "Low"] },
          { name: "Due Date", type: "date" },
        ],
        values: [["", "To Do", "Medium", ""]],
      };

    case "todolist":
      return { ...base, type, items: [{ task: "First task", done: false }] };

    case "document":
      return { ...base, type, content: `# ${name}\n\nStart writing here…` };

    case "calendar":
      return {
        ...base,
        type,
        events: [
          { id: newId("evt"), title: "First event", date: today, description: "" },
        ],
      };

    case "board":
      return {
        ...base,
        type,
        columns: [
          { name: "To Do", tasks: [{ id: newId("card"), title: "First card", description: "" }] },
          { name: "In Progress", tasks: [] },
          { name: "Done", tasks: [] },
        ],
      };

    case "habit":
      return {
        ...base,
        type,
        habits: [{ name: "First habit", goal: 7, streak: 0, log: {} }],
      };

    case "journal":
      return {
        ...base,
        type,
        entries: [{ date: now, title: "First entry", content: "", mood: "Neutral" }],
      };
  }
}
