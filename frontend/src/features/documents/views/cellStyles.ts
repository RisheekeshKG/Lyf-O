export type ColumnType = "text" | "options" | "date" | "checkbox" | "number";

export const COLUMN_TYPE_META: Record<ColumnType, { label: string; icon: string }> = {
  text: { label: "Text", icon: "notes" },
  options: { label: "Select", icon: "arrow_drop_down_circle" },
  date: { label: "Date", icon: "calendar_month" },
  checkbox: { label: "Checkbox", icon: "check_box" },
  number: { label: "Number", icon: "tag" },
};

export const COLUMN_TYPES = Object.keys(COLUMN_TYPE_META) as ColumnType[];

/** Muted chips tuned to the warm dark palette, in Notion's select-colour spirit. */
const PALETTE = [
  "bg-[#3a2f2c] text-[#e8cfc6]",
  "bg-[#4a3328] text-[#ffc9a8]",
  "bg-[#2f3a34] text-[#a8e6d0]",
  "bg-[#2e333f] text-[#bcc8e6]",
  "bg-[#3a2f3c] text-[#e0c2e8]",
  "bg-[#40312a] text-[#f0cba8]",
];

const SEMANTIC: { match: RegExp; className: string }[] = [
  { match: /^(done|complete|completed|shipped|closed|approved|yes)$/i, className: "bg-[#173f36] text-[#7df0d4]" },
  { match: /^(in progress|active|doing|ongoing|review|in review)$/i, className: "bg-[#4a3520] text-[#ffca8a]" },
  { match: /^(high|urgent|critical|blocked|overdue|no)$/i, className: "bg-[#4d211d] text-[#ffb4a1]" },
  { match: /^(medium|normal)$/i, className: "bg-[#3f3524] text-[#e8d2a0]" },
  { match: /^(low|backlog|someday|planned|todo|to do)$/i, className: "bg-[#33343a] text-[#c2c5cf]" },
];

export function pillClass(value: string): string {
  const trimmed = value.trim();
  const semantic = SEMANTIC.find((entry) => entry.match.test(trimmed));
  if (semantic) return semantic.className;

  const hash = [...trimmed.toLowerCase()].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return PALETTE[hash % PALETTE.length];
}

export function formatDate(value: string): string {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const now = new Date();
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }),
  });
}

export function isOverdue(value: string): boolean {
  if (!value) return false;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}
