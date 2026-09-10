"""
The template catalogue: what each recommendation actually becomes.

The recommender predicts template *names*; this turns a name into a real,
canonical page with columns and starter rows worth keeping. Every page here
goes through schemas.normalize before it reaches the app.
"""

from __future__ import annotations

from typing import Any, Dict, List

import schemas


def _table(name: str, columns: List[Dict[str, Any]], rows: List[List[Any]]) -> Dict[str, Any]:
    return {"name": name, "type": "table", "columns": columns, "values": rows}


def _col(name: str, kind: str = "text", options: List[str] | None = None) -> Dict[str, Any]:
    column: Dict[str, Any] = {"name": name, "type": kind}
    if options:
        column["options"] = options
    return column


STATUS = ["To Do", "In Progress", "Done"]
PRIORITY = ["High", "Medium", "Low"]


def _build() -> Dict[str, Dict[str, Any]]:
    return {
        "Personal To-Do": {
            "name": "Personal To-Do",
            "type": "todolist",
            "items": [
                {"task": "Reply to messages", "done": False},
                {"task": "Plan tomorrow", "done": False},
                {"task": "Tidy workspace", "done": False},
            ],
        },
        "Work Tasks": _table(
            "Work Tasks",
            [_col("Task"), _col("Status", "options", STATUS), _col("Priority", "options", PRIORITY), _col("Due Date", "date")],
            [["Weekly planning", "To Do", "High", ""], ["Follow up with team", "To Do", "Medium", ""]],
        ),
        "Project Board": {
            "name": "Project Board",
            "type": "board",
            "columns": [
                {"name": "Backlog", "tasks": [{"title": "Define scope", "description": "What's in and out"}]},
                {"name": "In Progress", "tasks": []},
                {"name": "In Review", "tasks": []},
                {"name": "Done", "tasks": []},
            ],
        },
        "Meeting Notes": {
            "name": "Meeting Notes",
            "type": "document",
            "content": (
                "# Meeting Notes\n\n## Attendees\n\n- \n\n## Agenda\n\n1. \n\n"
                "## Decisions\n\n- \n\n## Action items\n\n- [ ] \n"
            ),
        },
        "Client Pipeline": _table(
            "Client Pipeline",
            [_col("Client"), _col("Stage", "options", ["Lead", "Contacted", "Proposal", "Won", "Lost"]),
             _col("Value", "number"), _col("Next Step"), _col("Follow Up", "date")],
            [["", "Lead", "", "", ""]],
        ),
        "Study Planner": _table(
            "Study Planner",
            [_col("Subject"), _col("Topic"), _col("Status", "options", ["Not Started", "Revising", "Confident"]),
             _col("Exam Date", "date"), _col("Hours", "number")],
            [["", "", "Not Started", "", ""]],
        ),
        "Reading List": _table(
            "Reading List",
            [_col("Title"), _col("Author"), _col("Status", "options", ["To Read", "Reading", "Finished"]),
             _col("Rating", "number"), _col("Finished", "date")],
            [["", "", "To Read", "", ""]],
        ),
        "Research Log": {
            "name": "Research Log",
            "type": "document",
            "content": (
                "# Research Log\n\n## Question\n\n\n## Method\n\n\n## Findings\n\n\n"
                "## Open threads\n\n- \n\n## References\n\n- \n"
            ),
        },
        "Workout Log": _table(
            "Workout Log",
            [_col("Exercise"), _col("Muscle Group", "options", ["Chest", "Back", "Legs", "Arms", "Core", "Cardio"]),
             _col("Sets", "number"), _col("Reps", "number"), _col("Weight", "number"), _col("Date", "date")],
            [["", "Chest", "", "", "", ""]],
        ),
        "Sleep Log": _table(
            "Sleep Log",
            [_col("Date", "date"), _col("Bedtime"), _col("Wake Time"), _col("Hours", "number"),
             _col("Quality", "options", ["Poor", "Fair", "Good", "Great"])],
            [["", "", "", "", "Fair"]],
        ),
        "Screen Time Detox": {
            "name": "Screen Time Detox",
            "type": "habit",
            "habits": [
                {"name": "No phone first hour", "goal": 7, "streak": 0, "log": {}},
                {"name": "Screens off by 22:00", "goal": 7, "streak": 0, "log": {}},
                {"name": "One offline evening", "goal": 3, "streak": 0, "log": {}},
            ],
        },
        "Habit Tracker": {
            "name": "Habit Tracker",
            "type": "habit",
            "habits": [
                {"name": "Move 30 minutes", "goal": 7, "streak": 0, "log": {}},
                {"name": "Read", "goal": 7, "streak": 0, "log": {}},
                {"name": "Drink water", "goal": 7, "streak": 0, "log": {}},
            ],
        },
        "Medication Tracker": _table(
            "Medication Tracker",
            [_col("Medication"), _col("Dose"), _col("Time"), _col("Taken", "checkbox"), _col("Refill By", "date")],
            [["", "", "", "", ""]],
        ),
        "Budget Tracker": _table(
            "Budget Tracker",
            [_col("Item"), _col("Category", "options", ["Rent", "Food", "Transport", "Bills", "Fun", "Savings"]),
             _col("Amount", "number"), _col("Paid", "checkbox"), _col("Due", "date")],
            [["", "Bills", "", "", ""]],
        ),
        "Meal Planner": {
            "name": "Meal Planner",
            "type": "calendar",
            "events": [{"title": "Plan the week's meals", "date": schemas.today(), "description": "Shopping list from this"}],
        },
        "Gratitude Journal": {
            "name": "Gratitude Journal",
            "type": "journal",
            "entries": [{"date": schemas.now_iso(), "title": "Today", "content": "Three things that went well…", "mood": "Neutral"}],
        },
    }


CATALOGUE: Dict[str, Dict[str, Any]] = _build()
TEMPLATE_NAMES = list(CATALOGUE)


def page_for(name: str) -> Dict[str, Any] | None:
    """A canonical, ready-to-save page for a recommended template."""
    raw = CATALOGUE.get(name)
    if raw is None:
        return None
    return schemas.normalize(dict(raw), name)
