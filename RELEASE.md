# Building a release

The app ships as a single installer containing both the Electron UI and a
compiled Python backend. Users need nothing else installed — no Python, no pip.

## How it fits together

```
Lyf-O.app
├─ Electron UI
└─ Resources/backend/lyfo-backend   ← PyInstaller bundle (FastAPI + model)
```

On launch, Electron picks the first free port from 8000, spawns the backend
with `LYFO_PORT` and `LYFO_DATA_DIR`, and kills it on quit. The renderer asks
the main process for the resolved URL (`get-api-url`) rather than assuming 8000,
so a second instance or an occupied port doesn't break it.

Pages are stored in Electron's `userData` directory, and the backend is pointed
at the same place — both sides read and write one set of files.

## Build locally

```bash
cd frontend
npm run release          # backend binary + renderer + installer for this OS
npm run release:mac      # macOS only
```

Installers land in `frontend/release/<version>/`.

To rebuild just the backend binary:

```bash
cd backend
./venv/bin/python -m PyInstaller lyfo-backend.spec --noconfirm
```

## Other platforms

**PyInstaller cannot cross-compile.** A macOS machine produces only the macOS
backend. Use the GitHub Actions workflow, which builds all three on their own
runners:

```bash
git tag v1.0.0 && git push origin v1.0.0
```

Installers are attached as workflow artifacts.

## Known gaps

**API key.** The packaged app ships without one, so the AI Assistant is offline
until `GOOGLE_API_KEY` is present in the environment Electron launches with.
`/recommend` and every local feature work regardless. Wiring a key field into
Settings (stored via keytar, passed to the spawned backend) is the natural fix.

**Code signing.** Builds are unsigned. macOS shows "unidentified developer" —
users must right-click → Open the first time, or you need an Apple Developer
certificate ($99/yr) plus notarisation. Windows shows a SmartScreen warning
without an EV certificate.

**Size.** ~230MB per installer, ~760MB installed. scipy, scikit-learn, pandas
and numpy dominate; they're required by the `kmodes` clustering model.

**Icon.** Still Electron's default. Add `build/icon.icns` (macOS) and
`build/icon.ico` (Windows) — electron-builder picks them up automatically.
