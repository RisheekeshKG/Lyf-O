"""
Canonical page schemas — the single source of truth for what a lyf-O page is.

Every page written to disk (by a user, by the AI, or by a recommendation)
passes through `normalize()` so the frontend only ever sees one shape per type.
Legacy shapes are accepted on read and upgraded, never emitted.
"""

from __future__ import annotations

import datetime
import uuid
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field, field_validator

SCHEMA_VERSION = 1

PageType = Literal["table", "todolist", "document", "calendar", "board", "habit", "journal"]

PAGE_TYPES: tuple[str, ...] = (
    "table",
    "todolist",
    "document",
    "calendar",
    "board",
    "habit",
    "journal",
)

COLUMN_TYPES: tuple[str, ...] = ("text", "options", "date", "checkbox", "number")


def today() -> str:
    return datetime.date.today().isoformat()


def now_iso() -> str:
    return datetime.datetime.now().isoformat()


def _new_id(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8]}"


# ----------------------------------------------------------------------------
# Models
# ----------------------------------------------------------------------------


class Column(BaseModel):
    name: str
    type: str = "text"
    options: Optional[List[str]] = None

    @field_validator("type")
    @classmethod
    def known_type(cls, value: str) -> str:
        value = (value or "text").strip().lower()
        return value if value in COLUMN_TYPES else "text"

    def model_post_init(self, _context: Any) -> None:
        if self.type == "options" and not self.options:
            object.__setattr__(self, "options", ["Option 1", "Option 2"])
        if self.type != "options":
            object.__setattr__(self, "options", None)


class TodoItem(BaseModel):
    task: str = ""
    done: bool = False


class CalendarEvent(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("evt"))
    title: str = "Untitled event"
    date: str = Field(default_factory=today)
    description: str = ""


class BoardCard(BaseModel):
    id: str = Field(default_factory=lambda: _new_id("card"))
    title: str = ""
    description: str = ""


class BoardColumn(BaseModel):
    name: str = "Untitled"
    tasks: List[BoardCard] = Field(default_factory=list)


class Habit(BaseModel):
    name: str = "New habit"
    goal: int = 7
    streak: int = 0
    # ISO date -> completed. The grid and streak are both derived from this.
    log: Dict[str, bool] = Field(default_factory=dict)


class JournalEntry(BaseModel):
    date: str = Field(default_factory=now_iso)
    title: str = ""
    content: str = ""
    mood: str = "Neutral"


class BasePage(BaseModel):
    name: str = "Untitled"
    schemaVersion: int = SCHEMA_VERSION
    createdAt: str = Field(default_factory=now_iso)
    updatedAt: str = Field(default_factory=now_iso)


class TablePage(BasePage):
    type: Literal["table"] = "table"
    columns: List[Column]
    values: List[List[Any]] = Field(default_factory=list)


class TodoListPage(BasePage):
    type: Literal["todolist"] = "todolist"
    items: List[TodoItem] = Field(default_factory=list)


class DocumentPage(BasePage):
    type: Literal["document"] = "document"
    content: str = ""


class CalendarPage(BasePage):
    type: Literal["calendar"] = "calendar"
    events: List[CalendarEvent] = Field(default_factory=list)


class BoardPage(BasePage):
    type: Literal["board"] = "board"
    columns: List[BoardColumn] = Field(default_factory=list)


class HabitPage(BasePage):
    type: Literal["habit"] = "habit"
    habits: List[Habit] = Field(default_factory=list)


class JournalPage(BasePage):
    type: Literal["journal"] = "journal"
    entries: List[JournalEntry] = Field(default_factory=list)


PAGE_MODELS: Dict[str, type[BasePage]] = {
    "table": TablePage,
    "todolist": TodoListPage,
    "document": DocumentPage,
    "calendar": CalendarPage,
    "board": BoardPage,
    "habit": HabitPage,
    "journal": JournalPage,
}


# ----------------------------------------------------------------------------
# Blank templates
# ----------------------------------------------------------------------------


def blank_page(page_type: str, name: str) -> Dict[str, Any]:
    """A valid, immediately-usable page of the given type."""
    page_type = (page_type or "todolist").strip().lower()
    if page_type not in PAGE_MODELS:
        page_type = "todolist"

    if page_type == "table":
        page = TablePage(
            name=name,
            columns=[
                Column(name="Task", type="text"),
                Column(name="Status", type="options", options=["To Do", "In Progress", "Done"]),
                Column(name="Priority", type="options", options=["High", "Medium", "Low"]),
                Column(name="Due Date", type="date"),
            ],
            values=[["", "To Do", "Medium", ""]],
        )
    elif page_type == "todolist":
        page = TodoListPage(name=name, items=[TodoItem(task="First task")])
    elif page_type == "document":
        page = DocumentPage(name=name, content=f"# {name}\n\nStart writing here…")
    elif page_type == "calendar":
        page = CalendarPage(name=name, events=[CalendarEvent(title="First event")])
    elif page_type == "board":
        page = BoardPage(
            name=name,
            columns=[
                BoardColumn(name="To Do", tasks=[BoardCard(title="First card")]),
                BoardColumn(name="In Progress"),
                BoardColumn(name="Done"),
            ],
        )
    elif page_type == "habit":
        page = HabitPage(name=name, habits=[Habit(name="First habit")])
    else:
        page = JournalPage(name=name, entries=[JournalEntry(title="First entry")])

    return page.model_dump(exclude_none=True)


# ----------------------------------------------------------------------------
# Normalization — accepts legacy and malformed shapes, emits canonical
# ----------------------------------------------------------------------------


def _as_list(value: Any) -> List[Any]:
    if isinstance(value, list):
        return value
    if value in (None, "", {}):
        return []
    return [value]


def _coerce_columns(raw: Any) -> List[Column]:
    columns: List[Column] = []
    for entry in _as_list(raw):
        if isinstance(entry, str):
            columns.append(Column(name=entry))
        elif isinstance(entry, dict) and str(entry.get("name", "")).strip():
            columns.append(
                Column(
                    name=str(entry["name"]).strip(),
                    type=str(entry.get("type", "text")),
                    options=entry.get("options") or entry.get("choices"),
                )
            )
    return columns


def _coerce_habits(data: Dict[str, Any]) -> List[Habit]:
    """Habits were once `items:[{habit,done}]`; carry those over into the log grid."""
    raw = data.get("habits")
    if not isinstance(raw, list) or not raw:
        raw = data.get("items")

    habits: List[Habit] = []
    for entry in _as_list(raw):
        if isinstance(entry, str):
            habits.append(Habit(name=entry))
            continue
        if not isinstance(entry, dict):
            continue

        name = entry.get("name") or entry.get("habit") or entry.get("task") or "Habit"
        log = entry.get("log") if isinstance(entry.get("log"), dict) else {}
        # A legacy `done` flag means "completed today".
        if not log and entry.get("done"):
            log = {today(): True}

        habits.append(
            Habit(
                name=str(name),
                goal=int(entry.get("goal") or 7),
                streak=int(entry.get("streak") or (1 if log else 0)),
                log={str(k): bool(v) for k, v in log.items()},
            )
        )
    return habits


def _coerce_board_columns(raw: Any) -> List[BoardColumn]:
    columns: List[BoardColumn] = []
    for entry in _as_list(raw):
        if not isinstance(entry, dict):
            continue
        # Cards have lived under `tasks` and `cards`, as objects and as bare strings.
        raw_cards = entry.get("tasks")
        if not isinstance(raw_cards, list):
            raw_cards = entry.get("cards") or []

        cards: List[BoardCard] = []
        for card in _as_list(raw_cards):
            if isinstance(card, str):
                cards.append(BoardCard(title=card))
            elif isinstance(card, dict):
                cards.append(
                    BoardCard(
                        id=str(card.get("id") or _new_id("card")),
                        title=str(card.get("title") or card.get("name") or ""),
                        description=str(card.get("description") or ""),
                    )
                )
        columns.append(BoardColumn(name=str(entry.get("name") or "Untitled"), tasks=cards))
    return columns


def _coerce_entries(raw: Any) -> List[JournalEntry]:
    entries: List[JournalEntry] = []
    for entry in _as_list(raw):
        if isinstance(entry, str):
            entries.append(JournalEntry(content=entry))
        elif isinstance(entry, dict):
            entries.append(
                JournalEntry(
                    date=str(entry.get("date") or now_iso()),
                    title=str(entry.get("title") or ""),
                    # `text` and `entry` were both used before `content`.
                    content=str(entry.get("content") or entry.get("text") or entry.get("entry") or ""),
                    mood=str(entry.get("mood") or "Neutral"),
                )
            )
    return entries


def detect_type(data: Dict[str, Any]) -> str:
    """Infer the page type when it's missing or unknown, from the keys present."""
    declared = str(data.get("type", "")).strip().lower()
    if declared in PAGE_MODELS:
        return declared

    if isinstance(data.get("values"), list) and isinstance(data.get("columns"), list):
        return "table"
    if isinstance(data.get("columns"), list):
        return "board"
    if isinstance(data.get("events"), list):
        return "calendar"
    if isinstance(data.get("entries"), list):
        return "journal"
    if isinstance(data.get("habits"), list):
        return "habit"
    if isinstance(data.get("content"), str):
        return "document"
    return "todolist"


def normalize(data: Any, fallback_name: str = "Untitled") -> Dict[str, Any]:
    """
    Turn anything page-shaped into a valid canonical page.

    Never raises: a page that cannot be understood becomes an empty page of the
    best-guess type rather than failing the request that produced it.
    """
    if not isinstance(data, dict):
        return blank_page("todolist", fallback_name)

    page_type = detect_type(data)
    name = str(data.get("name") or fallback_name).strip() or fallback_name

    common = {
        "name": name,
        "schemaVersion": SCHEMA_VERSION,
        "createdAt": str(data.get("createdAt") or now_iso()),
        "updatedAt": now_iso(),
    }

    try:
        if page_type == "table":
            columns = _coerce_columns(data.get("columns"))
            if not columns:
                return blank_page("table", name)

            width = len(columns)
            rows: List[List[Any]] = []
            for row in _as_list(data.get("values")):
                if isinstance(row, dict):  # some models emit row objects
                    row = [row.get(column.name, "") for column in columns]
                if not isinstance(row, list):
                    continue
                trimmed = list(row[:width]) + [""] * max(0, width - len(row))
                rows.append(["" if cell is None else cell for cell in trimmed])

            page = TablePage(**common, columns=columns, values=rows)

        elif page_type == "todolist":
            items = []
            for entry in _as_list(data.get("items")):
                if isinstance(entry, str):
                    items.append(TodoItem(task=entry))
                elif isinstance(entry, dict):
                    items.append(
                        TodoItem(
                            task=str(entry.get("task") or entry.get("title") or entry.get("name") or ""),
                            done=bool(entry.get("done")),
                        )
                    )
            page = TodoListPage(**common, items=items)

        elif page_type == "document":
            page = DocumentPage(**common, content=str(data.get("content") or ""))

        elif page_type == "calendar":
            events = []
            for entry in _as_list(data.get("events")):
                if isinstance(entry, dict):
                    events.append(
                        CalendarEvent(
                            id=str(entry.get("id") or _new_id("evt")),
                            title=str(entry.get("title") or entry.get("name") or "Untitled event"),
                            date=str(entry.get("date") or today())[:10],
                            description=str(entry.get("description") or ""),
                        )
                    )
            page = CalendarPage(**common, events=events)

        elif page_type == "board":
            columns = _coerce_board_columns(data.get("columns"))
            page = BoardPage(**common, columns=columns or _coerce_board_columns(
                [{"name": "To Do", "tasks": []}]
            ))

        elif page_type == "habit":
            page = HabitPage(**common, habits=_coerce_habits(data))

        else:
            page = JournalPage(**common, entries=_coerce_entries(data.get("entries")))

        return page.model_dump(exclude_none=True)

    except Exception:  # a malformed page must not break the caller
        return blank_page(page_type, name)


# ----------------------------------------------------------------------------
# JSON Schema for the model
# ----------------------------------------------------------------------------


def json_schema_for(page_type: str) -> Dict[str, Any]:
    model = PAGE_MODELS.get(page_type, TodoListPage)
    schema = model.model_json_schema()
    # These are filled in server-side; asking the model for them wastes tokens.
    for key in ("schemaVersion", "createdAt", "updatedAt"):
        schema.get("properties", {}).pop(key, None)
    schema["required"] = [
        field for field in schema.get("required", []) if field not in {"schemaVersion", "createdAt", "updatedAt"}
    ]
    return schema


def shape_hint(page_type: str) -> str:
    """A compact one-line example, cheaper and clearer for the model than JSON Schema."""
    example = blank_page(page_type, "Example")
    for key in ("schemaVersion", "createdAt", "updatedAt"):
        example.pop(key, None)
    import json

    return json.dumps(example, separators=(",", ":"))
