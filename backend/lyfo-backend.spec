# PyInstaller spec for the lyf-O backend.
#
# Build:  ./venv/bin/python -m PyInstaller lyfo-backend.spec --noconfirm
# Output: dist/lyfo-backend/  (folder — faster cold start than --onefile)
#
# PyInstaller cannot cross-compile: run this on each target OS.

from PyInstaller.utils.hooks import collect_all, collect_submodules

datas = [
    ("data/clustered.csv", "data"),
    ("models/kproto_model.pkl", "models"),
    # Trained template ranker — /recommend degrades to popularity without it.
    ("models/recommender.joblib", "models"),
]
binaries = []
hiddenimports = [
    "catalogue",
    "recommender",
    "schemas",
    "agent",
    "sklearn.ensemble._hist_gradient_boosting",
    "uvicorn.logging",
    "uvicorn.loops.auto",
    "uvicorn.protocols.http.auto",
    "uvicorn.protocols.websockets.auto",
    "uvicorn.lifespan.on",
    # joblib unpickles the model into these
    "sklearn.utils._typedefs",
    "sklearn.neighbors._partition_nodes",
]

# These pull in data files and C extensions that PyInstaller's static analysis misses.
for package in ("kmodes", "sklearn", "scipy", "pandas", "numpy", "langchain",
                "langchain_google_genai", "google.generativeai"):
    try:
        pkg_datas, pkg_binaries, pkg_hidden = collect_all(package)
        datas += pkg_datas
        binaries += pkg_binaries
        hiddenimports += pkg_hidden
    except Exception as error:  # a missing optional package must not break the build
        print(f"spec: skipping {package}: {error}")

hiddenimports += collect_submodules("uvicorn")

a = Analysis(
    ["main.py"],
    pathex=["."],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    runtime_hooks=[],
    # Trimming what a headless API server never needs.
    excludes=["tkinter", "matplotlib", "PyQt5", "PySide2", "IPython", "notebook", "pytest"],
    noarchive=False,
)

pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="lyfo-backend",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=False,
    console=True,
)

coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=False,
    name="lyfo-backend",
)
