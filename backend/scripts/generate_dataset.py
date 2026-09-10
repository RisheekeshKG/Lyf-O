"""
Generate the lifestyle → template training set.

The shipped dataset had only two distinct templates spread evenly across every
cluster, so no model could discriminate: a 21-year-old student and a 59-year-old
officer got identical recommendations. This builds a catalogue whose assignment
genuinely depends on the six input features, with enough noise that the task is
learnable but not trivial.

Usage:  ./venv/bin/python scripts/generate_dataset.py [--rows 12000] [--seed 42]
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

import numpy as np
import pandas as pd

BASE_DIR = Path(__file__).resolve().parent.parent
OUT_PATH = BASE_DIR / "data" / "lifestyle_templates.csv"

GENDERS = ["Female", "Male", "Other"]
EDUCATION = ["High School", "Bachelor", "Master", "PhD"]
DEVICES = ["Desktop", "Laptop", "Mobile", "Tablet"]

OCCUPATIONS = [
    "Analyst", "Chef", "Consultant", "Designer", "Developer", "Doctor",
    "Engineer", "Manager", "Nurse", "Officer", "Professor", "Researcher",
    "Student", "Teacher",
]

# Occupations grouped by the kind of working life they imply.
DESK_WORK = {"Analyst", "Consultant", "Designer", "Developer", "Engineer", "Manager", "Researcher"}
CLIENT_FACING = {"Consultant", "Designer", "Manager", "Analyst"}
ACADEMIC = {"Professor", "Researcher", "Student", "Teacher"}
SHIFT_WORK = {"Chef", "Doctor", "Nurse", "Officer"}
CARE_WORK = {"Doctor", "Nurse"}


def logistic(x: float) -> float:
    return 1.0 / (1.0 + np.exp(-x))


# Each rule returns a log-odds score for one template given a person.
# Positive pushes the template toward being recommended.
TEMPLATE_RULES: dict[str, callable] = {
    # Universal baseline — nearly everyone, slightly more for younger people.
    "Personal To-Do": lambda r: 1.6 - 0.01 * (r["age"] - 30),

    # Employment-driven
    "Work Tasks": lambda r: (
        2.2 if r["occupation"] != "Student" else -1.4
    ) + (0.6 if r["occupation"] in DESK_WORK else 0.0),

    "Project Board": lambda r: (
        1.5 if r["occupation"] in {"Developer", "Engineer", "Designer", "Manager"} else -2.0
    ) + (0.5 if r["device_type"] in {"Desktop", "Laptop"} else -0.4),

    "Meeting Notes": lambda r: (
        1.4 if r["occupation"] in {"Manager", "Consultant", "Officer", "Teacher"} else -1.9
    ) + 0.02 * (r["age"] - 30),

    "Client Pipeline": lambda r: (
        1.7 if r["occupation"] in CLIENT_FACING else -2.6
    ) + (0.4 if r["education_level"] in {"Master", "PhD"} else 0.0),

    # Study / academia
    "Study Planner": lambda r: (
        2.4 if r["occupation"] == "Student" else -2.2
    ) + (0.8 if r["age"] < 25 else -0.5) + (0.4 if r["education_level"] != "High School" else 0.0),

    "Reading List": lambda r: (
        1.3 if r["occupation"] in ACADEMIC else -1.2
    ) + (0.9 if r["education_level"] in {"Master", "PhD"} else -0.3),

    "Research Log": lambda r: (
        2.0 if r["occupation"] in {"Researcher", "Professor"} else -2.8
    ) + (1.0 if r["education_level"] == "PhD" else -0.4),

    # Health and routine — driven by age and screen time
    "Workout Log": lambda r: (
        1.4 - 0.045 * (r["age"] - 28)
    ) + (0.4 if r["occupation"] in SHIFT_WORK else 0.0),

    "Sleep Log": lambda r: (
        0.55 * (r["daily_usage_hours"] - 6.0)
    ) + (0.7 if r["occupation"] in SHIFT_WORK else -0.3) - 0.4,

    "Screen Time Detox": lambda r: (
        1.1 * (r["daily_usage_hours"] - 7.0)
    ) + (0.5 if r["device_type"] == "Mobile" else -0.2) - 0.8,

    "Habit Tracker": lambda r: (
        1.2 - 0.03 * (r["age"] - 25)
    ) + (0.3 * (r["daily_usage_hours"] - 5.5)),

    "Medication Tracker": lambda r: (
        0.09 * (r["age"] - 52)
    ) + (0.8 if r["occupation"] in CARE_WORK else 0.0) - 1.2,

    # Home and money
    "Budget Tracker": lambda r: (
        0.9 if 24 <= r["age"] <= 55 else -0.6
    ) + (0.5 if r["occupation"] != "Student" else 0.3),

    "Meal Planner": lambda r: (
        1.6 if r["occupation"] == "Chef" else 0.0
    ) + (0.5 if 28 <= r["age"] <= 55 else -0.4) - 0.5,

    "Gratitude Journal": lambda r: (
        0.35 * (r["daily_usage_hours"] - 6.0)
    ) + (0.5 if r["gender"] == "Female" else 0.0) - 0.9,
}

TEMPLATE_NAMES = list(TEMPLATE_RULES)

# Structure each template renders as, matching backend/schemas.py.
TEMPLATE_SHAPES: dict[str, str] = {
    "Personal To-Do": "todolist",
    "Work Tasks": "table",
    "Project Board": "board",
    "Meeting Notes": "document",
    "Client Pipeline": "table",
    "Study Planner": "table",
    "Reading List": "table",
    "Research Log": "document",
    "Workout Log": "table",
    "Sleep Log": "table",
    "Screen Time Detox": "habit",
    "Habit Tracker": "habit",
    "Medication Tracker": "table",
    "Budget Tracker": "table",
    "Meal Planner": "calendar",
    "Gratitude Journal": "journal",
}


def sample_person(rng: np.random.Generator) -> dict:
    """Draw a person whose attributes hang together plausibly."""
    occupation = str(rng.choice(OCCUPATIONS))

    # Age depends on occupation — students are young, professors are not.
    if occupation == "Student":
        age = int(np.clip(rng.normal(21, 3), 16, 30))
    elif occupation in {"Professor", "Officer"}:
        age = int(np.clip(rng.normal(50, 9), 30, 65))
    elif occupation in {"Manager", "Consultant", "Doctor"}:
        age = int(np.clip(rng.normal(42, 9), 26, 65))
    else:
        age = int(np.clip(rng.normal(34, 10), 18, 65))

    # Education follows age and field.
    if occupation in {"Professor", "Researcher"}:
        education = str(rng.choice(EDUCATION, p=[0.02, 0.13, 0.35, 0.50]))
    elif occupation == "Student":
        education = str(rng.choice(EDUCATION, p=[0.45, 0.40, 0.13, 0.02]))
    elif occupation in {"Chef", "Officer"}:
        education = str(rng.choice(EDUCATION, p=[0.45, 0.42, 0.11, 0.02]))
    else:
        education = str(rng.choice(EDUCATION, p=[0.15, 0.52, 0.28, 0.05]))

    # Device follows occupation and age.
    if occupation in DESK_WORK:
        device = str(rng.choice(DEVICES, p=[0.34, 0.48, 0.12, 0.06]))
    elif occupation == "Student":
        device = str(rng.choice(DEVICES, p=[0.08, 0.44, 0.42, 0.06]))
    elif age > 55:
        device = str(rng.choice(DEVICES, p=[0.22, 0.20, 0.30, 0.28]))
    else:
        device = str(rng.choice(DEVICES, p=[0.18, 0.30, 0.42, 0.10]))

    # Screen time falls with age and rises for desk work.
    usage = rng.normal(7.6 - 0.045 * (age - 20), 1.25)
    if occupation in DESK_WORK:
        usage += 0.8
    if occupation in SHIFT_WORK:
        usage -= 0.6
    usage = float(np.clip(round(usage, 1), 1.0, 14.0))

    return {
        "age": age,
        "gender": str(rng.choice(GENDERS, p=[0.48, 0.48, 0.04])),
        "occupation": occupation,
        "education_level": education,
        "device_type": device,
        "daily_usage_hours": usage,
    }


# Pulls every template's base rate down so a workspace is a handful of pages,
# not half the catalogue. Feature effects stay the same size, so they dominate
# the intercept and the label actually depends on who the person is.
SELECTIVITY = 2.3


def assign_templates(person: dict, rng: np.random.Generator, noise: float = 0.55) -> list[str]:
    """
    Sample templates from per-template probabilities.

    `noise` keeps the mapping stochastic: identical people don't get identical
    sets, which is what stops a model from trivially memorising the rules.
    """
    chosen = []
    for name, rule in TEMPLATE_RULES.items():
        score = rule(person) - SELECTIVITY + rng.normal(0, noise)
        if rng.random() < logistic(score):
            chosen.append(name)

    # Nobody should have an empty workspace.
    if not chosen:
        chosen.append("Personal To-Do")
    return chosen


def build_template_payload(name: str) -> dict:
    """The page object stored alongside the label, ready for the frontend."""
    return {"name": name, "type": TEMPLATE_SHAPES[name]}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--rows", type=int, default=12000)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=Path, default=OUT_PATH)
    args = parser.parse_args()

    rng = np.random.default_rng(args.seed)

    records = []
    for _ in range(args.rows):
        person = sample_person(rng)
        templates = assign_templates(person, rng)
        records.append(
            {
                **person,
                "templates": json.dumps(templates),
                "template": json.dumps([build_template_payload(t) for t in templates]),
            }
        )

    df = pd.DataFrame(records)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(args.out, index=False)

    counts = df.templates.apply(json.loads)
    print(f"wrote {len(df):,} rows -> {args.out}")
    print(f"distinct templates: {len(TEMPLATE_NAMES)}")
    print(f"templates per user: mean {counts.str.len().mean():.1f}, "
          f"min {counts.str.len().min()}, max {counts.str.len().max()}")
    print("\nprevalence:")
    from collections import Counter

    tally = Counter(t for row in counts for t in row)
    for name, count in tally.most_common():
        print(f"  {name:20} {count / len(df):5.1%}")


if __name__ == "__main__":
    main()
