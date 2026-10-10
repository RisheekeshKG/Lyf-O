# Lyf-O

Lyf-O is a local-first lifestyle & productivity workspace featuring an integrated AI assistant and ML-driven template recommendations. Built with an Electron + React frontend and a Python FastAPI backend, Lyf-O empowers users to create, organize, and manage personal data—including To-Do lists, Tables, Kanban boards, Habits, Journals, Calendars, and Documents—with complete local data privacy and intelligent assistance.

---

## ✨ Features

- **Local-First Data Privacy**: Pages and user workspace data are saved directly to local JSON files (`~/.lyfo/data` or `frontend/data`), keeping data private and easily accessible offline.
- **AI Assistant**: Natural language conversation powered by Google Gemini (via LangChain) capable of executing direct workspace actions (creating pages, updating rows/cards, reading content, and listing pages).
- **ML Template Recommendations**: Personalized template recommendations generated using machine learning models (HistGradientBoosting / K-Prototypes clustering) based on user demographics and usage patterns.
- **Rich Interactive Views**:
  - **To-Do Lists**: Manage task lists with completion checkmarks.
  - **Tables**: Multi-column data tables with customizable types (text, options, date, checkbox, number).
  - **Kanban Boards**: Drag and organize tasks into customizable lanes.
  - **Habit Tracker**: Track habit streaks and daily goals.
  - **Journal**: Clean text entries with mood tracking.
  - **Calendar**: Schedule events and manage appointments.
  - **Documents**: Markdown document editor.

---

## 🏗️ Architecture & Tech Stack

```
Lyf-O Desktop App
 ├── Frontend (Electron + React + TypeScript + TailwindCSS)
 │     ├── Local JSON Storage IPC Interactivity
 │     └── Dynamic REST API communication with local backend
 └── Backend (Python FastAPI + LangChain + Scikit-Learn)
       ├── Gemini LLM Integration for chat & tool invocation
       └── Recommender engine for personalized template suggestion
```

- **Frontend**: Electron, React 18, TypeScript, Vite, Tailwind CSS, Lucide React, Framer Motion, React Markdown.
- **Backend**: Python 3.10+, FastAPI, Uvicorn, LangChain, `langchain-google-genai`, Scikit-Learn, `kmodes`, PyInstaller.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18+ and `npm`
- **Python**: v3.10+
- **Google Gemini API Key**: Optional for offline use, required for AI assistant features (`GOOGLE_API_KEY`).

---

### Installation & Local Setup

#### 1. Clone the Repository

```bash
git clone https://github.com/your-username/lyf-o.git
cd lyf-o
```

#### 2. Backend Setup

Set up a Python virtual environment and install dependencies:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Configure your environment variables in `backend/.env`:

```env
GOOGLE_API_KEY=your_gemini_api_key_here
MODEL_NAME=gemini-1.5-pro
LYFO_PORT=8000
```

Start the backend server:

```bash
python main.py
# Server runs on http://127.0.0.1:8000
```

#### 3. Frontend Setup

In a new terminal, navigate to the `frontend` directory and install dependencies:

```bash
cd frontend
npm install
```

Start the Electron dev environment:

```bash
npm run dev
```

---

## 🛠️ Building & Packaging for Release

Lyf-O bundles the FastAPI backend into a standalone executable using **PyInstaller**, which is launched internally by the Electron main process.

To build the executable and installer for your current OS:

```bash
cd frontend
npm run release
```

*For macOS specific builds:*

```bash
npm run release:mac
```

Bundled installers will be generated under `frontend/release/`.

To build only the Python backend binary using PyInstaller:

```bash
cd backend
./venv/bin/python -m PyInstaller lyfo-backend.spec --noconfirm
```

---

## 📁 Repository Structure

```
.
├── architecture.md             # Detailed high-level system architecture
├── RELEASE.md                  # Release pipeline and packaging guide
├── backend/
│   ├── agent.py                # LangChain tool calling & JSON generation
│   ├── catalogue.py            # Pre-defined template canonical definitions
│   ├── main.py                 # FastAPI server & route handlers
│   ├── recommender.py          # ML template recommendation engine
│   ├── schemas.py              # Page schema normalization & validation
│   ├── lyfo-backend.spec       # PyInstaller build specification
│   └── requirements.txt        # Backend dependencies
└── frontend/
    ├── electron/               # Electron main and preload scripts
    ├── src/                    # React components, pages, hooks, layout
    ├── package.json            # Node dependencies & release scripts
    └── vite.config.ts          # Vite bundler configuration
```

---

## 📡 API Endpoints Summary

- `GET /health` – Health check & system diagnostic status.
- `POST /chat/chat` – Conversational chat endpoint & workspace tool execution.
- `POST /chat/enhance` – Personalizes JSON template content given user profile.
- `GET /recommend` – Generic fallback template recommendations.
- `POST /recommend` – Returns personalized template recommendations based on user profile.
- `GET /recommend/explain` – Probabilities breakdown for template ranking.

---

## 📄 License

[MIT](LICENSE) (or as specified by project maintainer).
