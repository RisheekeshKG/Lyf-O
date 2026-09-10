"""
Serving side of the template recommender.

Loads the trained artefact and turns six profile features into ranked, ready-to-
save pages. Falls back to catalogue popularity if the model is missing, so
/recommend never hard-fails.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np

import catalogue

FEATURES = ["age", "gender", "occupation", "education_level", "device_type", "daily_usage_hours"]

# Shown when no model is available — the broadly useful pages, in order.
FALLBACK_ORDER = [
    "Personal To-Do", "Work Tasks", "Habit Tracker", "Budget Tracker", "Workout Log",
]


class Recommender:
    def __init__(self, model_path: Path):
        self.path = model_path
        self.artefact: Optional[Dict[str, Any]] = None
        self.error: Optional[str] = None
        self._load()

    def _load(self) -> None:
        if not self.path.exists():
            self.error = f"{self.path.name} not found"
            return
        try:
            self.artefact = joblib.load(self.path)
        except Exception as error:  # a corrupt artefact must not stop the server
            self.error = str(error)
            self.artefact = None

    @property
    def ready(self) -> bool:
        return self.artefact is not None

    @property
    def metrics(self) -> Dict[str, Any]:
        return (self.artefact or {}).get("metrics", {})

    def _encode(self, profile: Dict[str, Any]) -> np.ndarray:
        encoder = self.artefact["encoder"]
        categorical = self.artefact["categorical"]

        # Unseen categories encode to -1 rather than raising.
        cat_values = [[str(profile.get(column, "")) for column in categorical]]
        encoded = encoder.transform(cat_values)[0]

        row, cat_i = [], 0
        for name in FEATURES:
            if name in categorical:
                row.append(float(encoded[cat_i]))
                cat_i += 1
            else:
                row.append(float(profile.get(name) or 0))
        return np.array([row], dtype=float)

    def score(self, profile: Dict[str, Any]) -> List[tuple[str, float]]:
        """Every template with its probability, best first."""
        if not self.ready:
            total = len(FALLBACK_ORDER)
            return [(name, (total - i) / total) for i, name in enumerate(FALLBACK_ORDER)]

        features = self._encode(profile)
        labels = self.artefact["labels"]
        scored = [
            (label, float(model.predict_proba(features)[0][1]))
            for label, model in zip(labels, self.artefact["models"])
        ]
        return sorted(scored, key=lambda pair: -pair[1])

    def recommend(self, profile: Dict[str, Any], limit: int = 3) -> List[Dict[str, Any]]:
        """Top templates as canonical pages, each carrying why it was picked."""
        results = []
        for name, probability in self.score(profile):
            page = catalogue.page_for(name)
            if page is None:
                continue
            page["match"] = round(probability, 3)
            results.append(page)
            if len(results) >= limit:
                break
        return results
