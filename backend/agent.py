"""
The AI tool layer: how a chat message becomes an action on the user's pages.

Design notes:
- Tools declare JSON parameter schemas, so the model is told the argument names
  instead of guessing them.
- Model output is parsed with a balanced-brace scanner, not a greedy regex —
  fenced code blocks and trailing prose no longer break tool calls.
- Every page the model produces is passed through `schemas.normalize`, so a
  sloppy generation still lands on disk as a valid page.
"""

from __future__ import annotations

import json
import re
import traceback
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Tuple

import schemas

# ----------------------------------------------------------------------------
# Robust JSON extraction
# ----------------------------------------------------------------------------

_FENCE = re.compile(r"```(?:json)?\s*(.*?)```", re.S | re.I)


def extract_json(text: str) -> Optional[Any]:
    """
    Pull the first complete JSON value out of an LLM response.

    Handles ```json fences, leading prose, and trailing commentary by scanning
    for balanced braces while respecting strings and escapes.
    """
    if not text:
        return None

    candidates: List[str] = []

    fenced = _FENCE.search(text)
    if fenced:
        candidates.append(fenced.group(1).strip())
    candidates.append(text.strip())

    for candidate in candidates:
        try:
            return json.loads(candidate)
        except Exception:
            pass

        for opener, closer in (("{", "}"), ("[", "]")):
            start = candidate.find(opener)
            if start == -1:
                continue

            depth = 0
            in_string = False
            escaped = False
            for index in range(start, len(candidate)):
                char = candidate[index]

                if in_string:
                    if escaped:
                        escaped = False
                    elif char == "\\":
                        escaped = True
                    elif char == '"':
                        in_string = False
                    continue

                if char == '"':
                    in_string = True
                elif char == opener:
                    depth += 1
                elif char == closer:
                    depth -= 1
                    if depth == 0:
                        try:
                            return json.loads(candidate[start : index + 1])
                        except Exception:
                            break
    return None


# ----------------------------------------------------------------------------
# Page store
# ----------------------------------------------------------------------------


class PageStore:
    """Reads and writes canonical pages in the workspace data directory."""

    def __init__(self, data_dir: Path):
        self.data_dir = data_dir

    def filename_for(self, name: str) -> str:
        slug = re.sub(r"[^a-z0-9]+", "_", (name or "untitled").strip().lower()).strip("_")
        return f"{slug or 'untitled'}.json"

    def list(self) -> List[Dict[str, Any]]:
        pages = []
        for path in sorted(self.data_dir.glob("*.json")):
            try:
                data = json.loads(path.read_text(encoding="utf-8"))
                page_type = schemas.detect_type(data)
                entry: Dict[str, Any] = {
                    "file": path.name,
                    "name": data.get("name", path.stem),
                    "type": page_type,
                }

                # The selector needs the page's shape to target an edit correctly —
                # without column names it sends free text and the row lands wrong.
                if page_type == "table":
                    entry["columns"] = [
                        str(c.get("name"))
                        for c in data.get("columns", [])
                        if isinstance(c, dict) and c.get("name")
                    ]
                elif page_type == "board":
                    entry["lanes"] = [
                        str(c.get("name"))
                        for c in data.get("columns", [])
                        if isinstance(c, dict) and c.get("name")
                    ]

                pages.append(entry)
            except Exception:
                continue
        return pages

    def resolve(self, name: str) -> Optional[Path]:
        """Find a page by name, filename, or closest match."""
        if not name:
            return None

        target = self.data_dir / self.filename_for(name)
        if target.exists():
            return target

        needle = name.strip().lower()
        entries = [(entry, self.data_dir / entry["file"]) for entry in self.list()]

        for entry, path in entries:
            if entry["name"].strip().lower() == needle or entry["file"].lower() == needle:
                return path
        for entry, path in entries:
            if needle in entry["name"].strip().lower():
                return path

        from difflib import get_close_matches

        names = {entry["name"].strip().lower(): path for entry, path in entries}
        match = get_close_matches(needle, list(names), n=1, cutoff=0.6)
        return names[match[0]] if match else None

    def read(self, path: Path) -> Dict[str, Any]:
        return schemas.normalize(json.loads(path.read_text(encoding="utf-8")), path.stem)

    def write(self, page: Dict[str, Any], path: Optional[Path] = None) -> Path:
        page = schemas.normalize(page, page.get("name", "Untitled"))
        target = path or (self.data_dir / self.filename_for(page["name"]))
        target.write_text(json.dumps(page, indent=2), encoding="utf-8")
        return target


# ----------------------------------------------------------------------------
# Page generation
# ----------------------------------------------------------------------------

_GENERATION_PROMPT = """You generate a single JSON page for a Notion-like app.

Page name: {name}
Page type: {page_type}
What the user asked for: {request}

Return ONLY a JSON object matching this exact shape:
{shape}

Rules:
- Use the exact keys shown above. Do not invent or rename keys.
- Fill it with realistic, specific content for the user's request — not placeholders.
- For "table": every row must have exactly one value per column, in column order.
- For "table" columns, "type" must be one of: text, options, date, checkbox, number.
  Only columns with type "options" may have an "options" array.
- Aim for 3-6 rows/items of genuinely useful starting content.
- Output raw JSON only. No markdown fences, no commentary."""


def generate_page(llm, name: str, page_type: str, request: str) -> Tuple[Dict[str, Any], bool]:
    """
    Ask the model for page content. Returns (page, ai_generated).

    Falls back to a blank template if the model is unavailable or unusable —
    the caller always gets a valid page.
    """
    page_type = page_type if page_type in schemas.PAGE_MODELS else "todolist"

    try:
        prompt = _GENERATION_PROMPT.format(
            name=name,
            page_type=page_type,
            request=request or name,
            shape=schemas.shape_hint(page_type),
        )
        response = llm.invoke(prompt)
        text = getattr(response, "content", None) or str(response)

        parsed = extract_json(text)
        if not isinstance(parsed, dict):
            raise ValueError("model did not return a JSON object")

        parsed.setdefault("name", name)
        parsed["type"] = page_type
        return schemas.normalize(parsed, name), True

    except Exception as error:
        print(f"page generation fell back to template: {error}")
        return schemas.blank_page(page_type, name), False


# ----------------------------------------------------------------------------
# Tools
# ----------------------------------------------------------------------------


def _tool_create_page(store: PageStore, llm, args: Dict[str, Any]) -> Dict[str, Any]:
    name = str(args.get("name") or "Untitled").strip() or "Untitled"
    page_type = str(args.get("page_type") or args.get("type") or "todolist").strip().lower()
    request = str(args.get("request") or args.get("user_request") or name)

    page, ai_generated = generate_page(llm, name, page_type, request)
    path = store.write(page)

    return {
        "status": "created",
        "file": path.name,
        "content": page,
        "ai_generated": ai_generated,
        "message": f"Created **{page['name']}** ({page['type']})"
        + ("" if ai_generated else " — used a starter template, the model was unavailable."),
    }


def _tool_list_pages(store: PageStore, _llm, _args: Dict[str, Any]) -> Dict[str, Any]:
    pages = store.list()
    return {
        "status": "ok",
        "pages": pages,
        "message": (
            "You have no pages yet."
            if not pages
            else "Your pages: " + ", ".join(f"{p['name']} ({p['type']})" for p in pages)
        ),
    }


def _tool_read_page(store: PageStore, _llm, args: Dict[str, Any]) -> Dict[str, Any]:
    path = store.resolve(str(args.get("name") or ""))
    if not path:
        return {"status": "error", "message": f"No page named \"{args.get('name')}\"."}

    page = store.read(path)
    return {"status": "ok", "file": path.name, "content": page,
            "message": f"Read **{page['name']}**."}


def _tool_update_page(store: PageStore, _llm, args: Dict[str, Any]) -> Dict[str, Any]:
    """Apply one structured edit to an existing page."""
    path = store.resolve(str(args.get("name") or ""))
    if not path:
        return {"status": "error", "message": f"No page named \"{args.get('name')}\"."}

    page = store.read(path)
    operation = str(args.get("operation") or "add_item").strip().lower()
    value = args.get("value")
    page_type = page["type"]

    try:
        if operation in ("add_row", "add_item", "add_card", "add_event", "add_entry", "add_habit"):
            if page_type == "table":
                width = len(page["columns"])
                if isinstance(value, dict):
                    row = [value.get(column["name"], "") for column in page["columns"]]
                elif isinstance(value, list):
                    row = list(value[:width]) + [""] * max(0, width - len(value))
                else:
                    row = [str(value or "")] + [""] * (width - 1)
                page["values"].append(row)

            elif page_type == "todolist":
                page["items"].append({"task": str(value or "New task"), "done": False})

            elif page_type == "board":
                title = value.get("title") if isinstance(value, dict) else str(value or "New card")
                lane_name = str(args.get("column") or "").strip().lower()
                lane = next(
                    (c for c in page["columns"] if c["name"].strip().lower() == lane_name),
                    page["columns"][0] if page["columns"] else None,
                )
                if lane is None:
                    return {"status": "error", "message": "That board has no lanes."}
                lane["tasks"].append(
                    {
                        "id": schemas._new_id("card"),
                        "title": str(title or "New card"),
                        "description": str(value.get("description", "")) if isinstance(value, dict) else "",
                    }
                )

            elif page_type == "calendar":
                data = value if isinstance(value, dict) else {"title": str(value or "New event")}
                page["events"].append(
                    {
                        "id": schemas._new_id("evt"),
                        "title": str(data.get("title") or "New event"),
                        "date": str(data.get("date") or schemas.today())[:10],
                        "description": str(data.get("description") or ""),
                    }
                )

            elif page_type == "journal":
                data = value if isinstance(value, dict) else {"content": str(value or "")}
                page["entries"].insert(
                    0,
                    {
                        "date": schemas.now_iso(),
                        "title": str(data.get("title") or ""),
                        "content": str(data.get("content") or ""),
                        "mood": str(data.get("mood") or "Neutral"),
                    },
                )

            elif page_type == "habit":
                name = value.get("name") if isinstance(value, dict) else str(value or "New habit")
                page["habits"].append({"name": str(name), "goal": 7, "streak": 0, "log": {}})

            elif page_type == "document":
                page["content"] = f"{page['content']}\n\n{value or ''}".strip()

        elif operation == "append_content" and page_type == "document":
            page["content"] = f"{page['content']}\n\n{value or ''}".strip()

        elif operation == "set_cell" and page_type == "table":
            row_index = int(args.get("row", 0))
            column_name = str(args.get("column") or "")
            column_index = next(
                (i for i, c in enumerate(page["columns"]) if c["name"].strip().lower() == column_name.strip().lower()),
                None,
            )
            if column_index is None or not (0 <= row_index < len(page["values"])):
                return {"status": "error", "message": "That row or column doesn't exist."}
            page["values"][row_index][column_index] = value

        elif operation == "toggle_item" and page_type == "todolist":
            index = int(args.get("row", 0))
            if not (0 <= index < len(page["items"])):
                return {"status": "error", "message": "That task doesn't exist."}
            page["items"][index]["done"] = not page["items"][index]["done"]

        elif operation == "rename":
            page["name"] = str(value or page["name"])

        else:
            return {
                "status": "error",
                "message": f"Can't do \"{operation}\" on a {page_type} page.",
            }

    except Exception as error:
        return {"status": "error", "message": f"Update failed: {error}"}

    saved = store.write(page, path)
    return {
        "status": "updated",
        "file": saved.name,
        "content": page,
        "message": f"Updated **{page['name']}**.",
    }


TOOL_SPECS: List[Dict[str, Any]] = [
    {
        "name": "create_page",
        "description": "Create a new page in the workspace. Use when the user asks to make, start, build or set up a tracker, list, board, note, journal, calendar or table.",
        "parameters": {
            "name": "Short title for the page, e.g. 'Workout Log'.",
            "page_type": f"One of: {', '.join(schemas.PAGE_TYPES)}.",
            "request": "What the user wants on it, in their own words.",
        },
        "handler": _tool_create_page,
    },
    {
        "name": "update_page",
        "description": "Add to or edit an existing page — add a row, task, card, event, journal entry or habit; tick a task off; set a cell; rename.",
        "parameters": {
            "name": "Which existing page to change.",
            "operation": "add_row | add_item | add_card | add_event | add_entry | add_habit | append_content | set_cell | toggle_item | rename",
            "value": "The content to add or set. Object for structured types, string otherwise.",
            "column": "For set_cell: the column name. For add_card: the lane name.",
            "row": "For set_cell/toggle_item: zero-based row index.",
        },
        "handler": _tool_update_page,
    },
    {
        "name": "read_page",
        "description": "Read one page's contents, so questions about what's on it can be answered.",
        "parameters": {"name": "Which page to read."},
        "handler": _tool_read_page,
    },
    {
        "name": "list_pages",
        "description": "List every page in the workspace with its type.",
        "parameters": {},
        "handler": _tool_list_pages,
    },
]

TOOLS_BY_NAME = {spec["name"]: spec for spec in TOOL_SPECS}


def _tool_catalogue() -> str:
    lines = []
    for spec in TOOL_SPECS:
        params = json.dumps(spec["parameters"], indent=2) if spec["parameters"] else "{}"
        lines.append(f"- {spec['name']}: {spec['description']}\n  arguments: {params}")
    return "\n".join(lines)


_SELECTOR_PROMPT = """You decide whether a user's message needs a workspace action.

Available tools:
{catalogue}

Pages that currently exist:
{pages}

User message:
{message}

Reply with ONE JSON object and nothing else.
To act:            {{"tool": "<tool name>", "arguments": {{...}}}}
To just converse:  {{"tool": null}}

Only choose a tool when the user is actually asking to create, change, read or
list their pages. Questions, greetings and general chat use {{"tool": null}}.

When adding a row to a table, "value" MUST be an object keyed by that table's
exact column names, e.g. {{"Exercise": "Deadlift", "Sets": 3, "Reps": 5}}.
Never put a whole sentence in one column. Leave unknown columns out."""


def _describe_pages(pages: List[Dict[str, Any]]) -> str:
    if not pages:
        return "(none yet)"

    lines = []
    for page in pages:
        detail = ""
        if page.get("columns"):
            detail = f" — columns: {', '.join(page['columns'])}"
        elif page.get("lanes"):
            detail = f" — lanes: {', '.join(page['lanes'])}"
        lines.append(f"- {page['name']} ({page['type']}){detail}")
    return "\n".join(lines)


def select_tool(llm, message: str, pages: List[Dict[str, Any]]) -> Optional[Tuple[str, Dict[str, Any]]]:
    """Ask the model which tool to run. Returns None for plain conversation."""
    prompt = _SELECTOR_PROMPT.format(
        catalogue=_tool_catalogue(), pages=_describe_pages(pages), message=message
    )

    try:
        response = llm.invoke(prompt)
        text = getattr(response, "content", None) or str(response)
    except Exception as error:
        print(f"tool selection unavailable: {error}")
        return None

    parsed = extract_json(text)
    if not isinstance(parsed, dict):
        return None

    name = parsed.get("tool")
    if not name or not isinstance(name, str) or name not in TOOLS_BY_NAME:
        return None

    arguments = parsed.get("arguments")
    return name, arguments if isinstance(arguments, dict) else {}


def run_tool(name: str, store: PageStore, llm, args: Dict[str, Any]) -> Dict[str, Any]:
    spec = TOOLS_BY_NAME.get(name)
    if not spec:
        return {"status": "error", "message": f"Unknown tool: {name}"}

    try:
        return spec["handler"](store, llm, args)
    except Exception as error:
        print(traceback.format_exc())
        return {"status": "error", "message": f"{name} failed: {error}"}
