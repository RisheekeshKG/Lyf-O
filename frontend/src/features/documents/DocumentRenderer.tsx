import { EmptyState } from "../../ui/EmptyState";
import { TableView } from "./views/TableView";
import { TodoListView } from "./views/TodoListView";
import { MarkdownView } from "./views/MarkdownView";
import { CalendarView } from "./views/CalendarView";
import { BoardView } from "./views/BoardView";
import { HabitView } from "./views/HabitView";
import { JournalView } from "./views/JournalView";
import type { ViewProps } from "./views/types";

const VIEWS: Record<string, (props: ViewProps) => JSX.Element> = {
  table: TableView,
  todolist: TodoListView,
  document: MarkdownView,
  calendar: CalendarView,
  board: BoardView,
  habit: HabitView,
  journal: JournalView,
};

export function DocumentRenderer({ data, onChange }: ViewProps) {
  const View = VIEWS[data?.type];

  if (!View) {
    return (
      <EmptyState
        icon="help"
        title="Unsupported page type"
        description={`No view is registered for "${data?.type ?? "unknown"}".`}
      />
    );
  }

  return <View data={data} onChange={onChange} />;
}
