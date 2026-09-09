import type { DocumentType } from "../../types";

interface DocumentMeta {
  label: string;
  icon: string;
}

export const DOCUMENT_META: Record<DocumentType, DocumentMeta> = {
  table: { label: "Table", icon: "table_chart" },
  todolist: { label: "To-do", icon: "checklist" },
  document: { label: "Document", icon: "description" },
  calendar: { label: "Calendar", icon: "calendar_month" },
  board: { label: "Board", icon: "view_kanban" },
  habit: { label: "Habit", icon: "local_fire_department" },
  journal: { label: "Journal", icon: "book" },
};

export const DOCUMENT_TYPES = Object.keys(DOCUMENT_META) as DocumentType[];

export function iconForType(type: string | undefined): string {
  return DOCUMENT_META[type as DocumentType]?.icon ?? "draft";
}
