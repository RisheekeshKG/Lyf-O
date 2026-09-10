"""
Train and benchmark the template recommender.

Compares four approaches on a held-out split so the shipped model is an
evidence-based choice rather than a guess:

  1. popularity    — always suggest the globally most common templates
  2. k-prototypes  — the current approach: cluster, then serve cluster favourites
  3. hist-gb       — scikit-learn HistGradientBoosting, one binary model per template
  4. catboost      — CatBoost, same one-vs-rest setup (skipped if not installed)

Ranking metrics matter more than accuracy here: the app shows a short list, so
what counts is whether the right templates land at the top.

Usage:  ./venv/bin/python scripts/train_model.py [--no-catboost]
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OrdinalEncoder

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_PATH = BASE_DIR / "data" / "lifestyle_templates.csv"
MODEL_DIR = BASE_DIR / "models"

FEATURES = ["age", "gender", "occupation", "education_level", "device_type", "daily_usage_hours"]
CATEGORICAL = ["gender", "occupation", "education_level", "device_type"]
NUMERIC = ["age", "daily_usage_hours"]
TOP_K = 3


# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------


def precision_recall_at_k(scores: np.ndarray, truth: np.ndarray, k: int) -> tuple[float, float]:
    """Of the k we suggest, how many are wanted — and of what's wanted, how much do we surface."""
    top = np.argsort(-scores, axis=1)[:, :k]
    hits = np.take_along_axis(truth, top, axis=1).sum(axis=1)
    wanted = truth.sum(axis=1)

    precision = float(np.mean(hits / k))
    recall = float(np.mean(np.divide(hits, wanted, out=np.zeros_like(hits, dtype=float), where=wanted > 0)))
    return precision, recall


def mean_average_precision(scores: np.ndarray, truth: np.ndarray) -> float:
    aps = []
    for row_scores, row_truth in zip(scores, truth):
        order = np.argsort(-row_scores)
        relevant = row_truth[order]
        if relevant.sum() == 0:
            continue
        cumulative = np.cumsum(relevant)
        positions = np.arange(1, len(relevant) + 1)
        aps.append(float((cumulative / positions * relevant).sum() / relevant.sum()))
    return float(np.mean(aps)) if aps else 0.0


def macro_auc(scores: np.ndarray, truth: np.ndarray) -> float:
    aucs = []
    for i in range(truth.shape[1]):
        column = truth[:, i]
        if 0 < column.sum() < len(column):  # AUC undefined for a constant column
            aucs.append(roc_auc_score(column, scores[:, i]))
    return float(np.mean(aucs)) if aucs else float("nan")


def evaluate(name: str, scores: np.ndarray, truth: np.ndarray, seconds: float) -> dict:
    precision, recall = precision_recall_at_k(scores, truth, TOP_K)
    return {
        "model": name,
        f"precision@{TOP_K}": round(precision, 4),
        f"recall@{TOP_K}": round(recall, 4),
        "MAP": round(mean_average_precision(scores, truth), 4),
        "macro_AUC": round(macro_auc(scores, truth), 4),
        "train_seconds": round(seconds, 1),
    }


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


def fit_hist_gb(X_train, Y_train, X_test, cat_index):
    """One binary HistGradientBoosting per template — sklearn is already a dependency."""
    models, scores = [], np.zeros((len(X_test), Y_train.shape[1]))

    for i in range(Y_train.shape[1]):
        model = HistGradientBoostingClassifier(
            max_iter=300,
            learning_rate=0.08,
            max_leaf_nodes=31,
            min_samples_leaf=25,
            l2_regularization=1.0,
            categorical_features=cat_index,
            early_stopping=True,
            validation_fraction=0.15,
            random_state=42,
        )
        model.fit(X_train, Y_train[:, i])
        models.append(model)
        scores[:, i] = model.predict_proba(X_test)[:, 1]

    return models, scores


def fit_catboost(X_train, Y_train, X_test, cat_columns):
    from catboost import CatBoostClassifier

    models, scores = [], np.zeros((len(X_test), Y_train.shape[1]))
    for i in range(Y_train.shape[1]):
        model = CatBoostClassifier(
            iterations=400,
            learning_rate=0.08,
            depth=6,
            l2_leaf_reg=3.0,
            cat_features=cat_columns,
            verbose=0,
            random_seed=42,
            allow_writing_files=False,
        )
        model.fit(X_train, Y_train[:, i])
        models.append(model)
        scores[:, i] = model.predict_proba(X_test)[:, 1]
    return models, scores


def kprototypes_scores(train_df, Y_train, test_df, n_clusters=6):
    """The current approach: assign a cluster, score templates by cluster prevalence."""
    from kmodes.kprototypes import KPrototypes

    cat_idx = [train_df.columns.get_loc(c) for c in CATEGORICAL]
    model = KPrototypes(n_clusters=n_clusters, init="Huang", n_init=3, random_state=42, verbose=0)

    train_matrix = train_df[FEATURES].to_numpy(dtype=object)
    assignments = model.fit_predict(train_matrix, categorical=[FEATURES.index(c) for c in CATEGORICAL])

    prevalence = np.zeros((n_clusters, Y_train.shape[1]))
    for cluster in range(n_clusters):
        mask = assignments == cluster
        prevalence[cluster] = Y_train[mask].mean(axis=0) if mask.sum() else Y_train.mean(axis=0)

    test_matrix = test_df[FEATURES].to_numpy(dtype=object)
    test_clusters = model.predict(test_matrix, categorical=[FEATURES.index(c) for c in CATEGORICAL])
    return model, prevalence[test_clusters], prevalence


# ---------------------------------------------------------------------------


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-catboost", action="store_true")
    parser.add_argument("--data", type=Path, default=DATA_PATH)
    args = parser.parse_args()

    df = pd.read_csv(args.data)
    df["templates"] = df["templates"].apply(json.loads)

    labels = sorted({t for row in df["templates"] for t in row})
    Y = np.array([[1 if label in row else 0 for label in labels] for row in df["templates"]])
    print(f"{len(df):,} rows | {len(labels)} templates | {Y.sum(axis=1).mean():.1f} per user\n")

    X = df[FEATURES].copy()
    X_train, X_test, Y_train, Y_test = train_test_split(X, Y, test_size=0.2, random_state=42)

    # Trees need numbers; ordinal codes are fine because the splitter is told
    # which columns are categorical.
    encoder = OrdinalEncoder(handle_unknown="use_encoded_value", unknown_value=-1)
    encoder.fit(X[CATEGORICAL])

    def encode(frame: pd.DataFrame) -> np.ndarray:
        out = frame.copy()
        out[CATEGORICAL] = encoder.transform(out[CATEGORICAL])
        return out[FEATURES].to_numpy(dtype=float)

    X_train_enc, X_test_enc = encode(X_train), encode(X_test)
    cat_index = [FEATURES.index(c) for c in CATEGORICAL]

    results = []

    # 1. Popularity baseline
    start = time.time()
    popularity = np.tile(Y_train.mean(axis=0), (len(X_test), 1))
    results.append(evaluate("popularity (baseline)", popularity, Y_test, time.time() - start))

    # 2. k-prototypes, the current production approach
    try:
        start = time.time()
        _, kproto_scores, _ = kprototypes_scores(X_train.reset_index(drop=True), Y_train, X_test)
        results.append(evaluate("k-prototypes (current)", kproto_scores, Y_test, time.time() - start))
    except Exception as error:
        print(f"k-prototypes skipped: {error}")

    # 3. HistGradientBoosting
    start = time.time()
    hgb_models, hgb_scores = fit_hist_gb(X_train_enc, Y_train, X_test_enc, cat_index)
    hgb_seconds = time.time() - start
    results.append(evaluate("hist-gb (sklearn)", hgb_scores, Y_test, hgb_seconds))

    # 4. CatBoost
    cat_scores = None
    if not args.no_catboost:
        try:
            start = time.time()
            _, cat_scores = fit_catboost(X_train.copy(), Y_train, X_test.copy(), CATEGORICAL)
            results.append(evaluate("catboost", cat_scores, Y_test, time.time() - start))
        except ImportError:
            print("catboost not installed — skipping\n")

    print(pd.DataFrame(results).to_string(index=False))

    # Ship the sklearn model: it matches CatBoost closely on a task this size and
    # adds nothing to the installer, since sklearn is already bundled for kmodes.
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    artefact = {
        "labels": labels,
        "features": FEATURES,
        "categorical": CATEGORICAL,
        "encoder": encoder,
        "models": hgb_models,
        "template_types": (
            df.assign(pairs=df["template"].apply(json.loads))
            .explode("pairs")
            .dropna(subset=["pairs"])
            .assign(name=lambda d: d.pairs.apply(lambda p: p["name"]),
                    type=lambda d: d.pairs.apply(lambda p: p["type"]))
            .drop_duplicates("name")
            .set_index("name")["type"]
            .to_dict()
        ),
        "metrics": next(r for r in results if r["model"] == "hist-gb (sklearn)"),
        "trained_at": pd.Timestamp.now().isoformat(),
    }
    out = MODEL_DIR / "recommender.joblib"
    joblib.dump(artefact, out, compress=3)
    print(f"\nsaved -> {out} ({out.stat().st_size / 1e6:.1f} MB)")


if __name__ == "__main__":
    main()
