# main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.prompts import PromptTemplate
from langchain.chains import LLMChain, ConversationChain
from langchain.memory import ConversationBufferMemory
from dotenv import load_dotenv
from pathlib import Path
from difflib import get_close_matches
from kmodes.kprototypes import KPrototypes

import agent
import schemas

import os, sys, json, uvicorn, re, traceback
import pandas as pd
import joblib
import numpy as np
import datetime

# ==========================================================
# ENV & PATHS
# ==========================================================
load_dotenv()

# When frozen by PyInstaller, bundled data lives in sys._MEIPASS, not next to
# the script. Everything else still resolves relative to the source tree.
IS_FROZEN = getattr(sys, "frozen", False)
BASE_DIR = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parent))

# The user's pages, written by the Electron app — not part of this repo's assets.
# Serverless hosts (Vercel, Lambda) mount a read-only filesystem with only /tmp
# writable, so this must never hard-fail at import or the whole app 500s.
DATA_DIR = Path(
    os.getenv("LYFO_DATA_DIR")
    or (Path.home() / ".lyfo" / "data" if IS_FROZEN else BASE_DIR.parent / "frontend" / "data")
)

try:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
except OSError as error:
    fallback = Path("/tmp/lyfo-data")
    print(f"WARNING: {DATA_DIR} is not writable ({error}); falling back to {fallback}. "
          "Page storage will not persist between requests on a serverless host.")
    DATA_DIR = fallback
    try:
        DATA_DIR.mkdir(parents=True, exist_ok=True)
    except OSError:
        pass

# Training data and the trained model that ship with the backend.
DATASET_DIR = BASE_DIR / "data"
MODEL_DIR = BASE_DIR / "models"

# Every read/write of a user page goes through this, so pages stay canonical.
page_store = agent.PageStore(DATA_DIR)

# ==========================================================
# APP
# ==========================================================
app = FastAPI(title="lyf-O backend")

# A packaged Electron renderer loads from file://, which sends "Origin: null" —
# the dev-only origin list blocked every request in production builds. The
# server binds to loopback, so any local origin is acceptable here.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^(http://localhost:\d+|http://127\.0\.0\.1:\d+|file://.*|null)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================================
# LLMs
# ==========================================================
class LLMUnavailable(RuntimeError):
    """No usable API key — the caller should degrade, not crash."""


# Built on first use, never at import. Constructing these with no key makes the
# Google client fall back to Application Default Credentials and raise, which
# previously killed the whole server — including /recommend, which needs no LLM.
_llm_cache: Dict[float, Any] = {}


def get_llm(temperature: float = 0.6):
    key = os.getenv("GOOGLE_API_KEY")
    if not key:
        raise LLMUnavailable(
            "No GOOGLE_API_KEY configured. Set it in backend/.env (development) "
            "or in the app's environment, then restart."
        )

    if temperature not in _llm_cache:
        _llm_cache[temperature] = ChatGoogleGenerativeAI(
            model=os.getenv("MODEL_NAME", "gemini-1.5-pro"),
            google_api_key=key,
            temperature=temperature,
        )
    return _llm_cache[temperature]


def llm_available() -> bool:
    return bool(os.getenv("GOOGLE_API_KEY"))


# ==========================================================
# Load CSV + KPrototypes (optional)
# ==========================================================
CSV_PATH = DATASET_DIR / "clustered.csv"
if CSV_PATH.exists():
    df_users = pd.read_csv(CSV_PATH)
else:
    df_users = pd.DataFrame(columns=["age","gender","occupation","education_level","device_type","daily_usage_hours","template","cluster"])
    print(f"WARNING: {CSV_PATH} not found. /recommend will be limited until present.")

def parse_template(x):
    try:
        if pd.isna(x):
            return []
        if isinstance(x, list):
            return x
        return json.loads(str(x).replace("''", '"'))
    except Exception:
        try:
            return json.loads(str(x))
        except Exception:
            return []

if "template" in df_users.columns:
    df_users["template"] = df_users["template"].apply(parse_template)
else:
    df_users["template"] = [[] for _ in range(len(df_users))]

KPROTO_PATH = MODEL_DIR / "kproto_model.pkl"
if KPROTO_PATH.exists():
    kproto: KPrototypes = joblib.load(KPROTO_PATH)
else:
    kproto = None
    print(f"WARNING: kproto_model.pkl not found. /recommend will fail until model is present.")

FEATURE_COLUMNS = ["age","gender","occupation","education_level","device_type","daily_usage_hours"]
CATEGORICAL_IDX = [1,2,3,4]

def to_kproto_vector(user_dict):
    return [
        user_dict["age"],
        user_dict["gender"],
        user_dict["occupation"],
        user_dict["education_level"],
        user_dict["device_type"],
        user_dict["daily_usage_hours"],
    ]

# ==========================================================
# Endpoints
# ==========================================================
@app.get("/health")
async def health():
    """Deployment sanity check — shows what actually loaded."""
    return {
        "status": "ok",
        "data_dir": str(DATA_DIR),
        "data_dir_writable": os.access(DATA_DIR, os.W_OK),
        "dataset_loaded": bool(len(df_users)),
        "model_loaded": kproto is not None,
        "llm_key_present": bool(os.getenv("GOOGLE_API_KEY")),
        "page_types": list(schemas.PAGE_TYPES),
    }


@app.post("/chat/enhance")
async def enhance_template(payload: dict):
    template = payload.get("template")
    user_profile = payload.get("user_profile")

    if not template:
        raise HTTPException(status_code=400, detail="Missing template.")

    if not llm_available():
        raise HTTPException(status_code=503, detail="No GOOGLE_API_KEY configured.")

    # Use llm_content to rewrite template based on the user's profile
    enhance_prompt = PromptTemplate(
        input_variables=["template", "profile"],
        template=(
            "You are an assistant that enhances a JSON template using a user's profile.\n"
            "Return ONLY valid JSON with **no trailing commas**, **no ...**, **no comments**, "
            "and the exact same structure as the input template.\n\n"
            "Input template:\n{template}\n\n"
            "User profile:\n{profile}\n\n"
            "Rules:\n"
            "1. KEEP the same keys: name, type, columns, values, items, etc.\n"
            "2. NEVER add unknown keys.\n"
            "3. ONLY modify the rows/items to be personalized.\n"
            "4. Return only JSON — no explanation.\n"
        )
    )

    chain = LLMChain(llm=get_llm(0.15), prompt=enhance_prompt)

    raw = chain.run({
        "template": json.dumps(template),
        "profile": json.dumps(user_profile or {})
    })

    # Extract JSON object only
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise HTTPException(status_code=500, detail="Invalid JSON returned")

    cleaned = match.group(0)

    try:
        enhanced = json.loads(cleaned)
    except:
        raise HTTPException(status_code=500, detail="JSON parsing failed")

    return {"enhanced": enhanced}


# ==========================================================
# Chat endpoint (tool selection + fallback to chat)
# ==========================================================
class Msg(BaseModel):
    content: str
    session_id: str = "default"


# Conversation memory is per session; one shared buffer leaked context between
# windows and grew without bound.
_SESSIONS: Dict[str, ConversationChain] = {}
_MAX_SESSIONS = 50


def session_chain(session_id: str) -> ConversationChain:
    if session_id not in _SESSIONS:
        if len(_SESSIONS) >= _MAX_SESSIONS:
            _SESSIONS.pop(next(iter(_SESSIONS)))
        _SESSIONS[session_id] = ConversationChain(
            llm=get_llm(0.6), memory=ConversationBufferMemory(return_messages=True)
        )
    return _SESSIONS[session_id]


@app.post("/chat/chat")
async def chat(m: Msg):
    """
    One turn: decide whether the message needs a workspace action, run it if so,
    otherwise converse. Tool failures are reported, never silently swallowed.
    """
    if not llm_available():
        return {
            "mode": "error",
            "generated_text": "No API key is configured, so the assistant is offline. "
            "Add GOOGLE_API_KEY to backend/.env and restart.",
        }

    try:
        selection = agent.select_tool(get_llm(0.0), m.content, page_store.list())

        if selection:
            tool_name, args = selection
            args.setdefault("request", m.content)
            result = agent.run_tool(tool_name, page_store, get_llm(0.15), args)

            return {
                "mode": "tool",
                "tool": tool_name,
                "result": result,
                "generated_text": result.get("message", ""),
            }

        try:
            reply = session_chain(m.session_id).predict(input=m.content)
        except Exception as error:
            # The assistant is unavailable (bad key, quota, network) — say so
            # plainly rather than returning a 500 the UI can't explain.
            print(f"chat unavailable: {error}")
            return {
                "mode": "error",
                "generated_text": "I can't reach the language model right now. "
                "Check the GOOGLE_API_KEY in backend/.env, then try again.",
            }

        if isinstance(reply, dict):
            reply = reply.get("output_text") or str(reply)
        return {"mode": "chat", "generated_text": reply}

    except Exception as e:
        print("CHAT ERROR:", traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

# ==========================================================
# Recommender endpoints (kept same behavior)
# ==========================================================
@app.get("/recommend")
async def recommend_random():
    if kproto is None:
        raise HTTPException(status_code=500, detail="kproto model is not loaded on server.")
    if df_users.empty:
        raise HTTPException(status_code=500, detail="User CSV not loaded or empty.")
    u = df_users.sample(1).iloc[0]
    user_vec = to_kproto_vector(u[FEATURE_COLUMNS].to_dict())
    user_np = np.array([user_vec], dtype=object)
    cluster = int(kproto.predict(user_np, categorical=CATEGORICAL_IDX)[0])
    cluster_users = df_users[df_users["cluster"] == cluster]
    templates = []
    for row in cluster_users["template"]:
        if row is None:
            continue
        if isinstance(row, str):
            try:
                row = json.loads(row)
            except:
                continue
        if isinstance(row, dict):
            row = [row]
        if isinstance(row, list):
            for item in row:
                if isinstance(item, dict):
                    templates.append(item)
    seen = set()
    unique = []
    for t in templates:
        nm = t.get("name","").lower().strip()
        if nm and nm not in seen:
            seen.add(nm)
            unique.append(t)
    return {"mode":"random","cluster":cluster,"user_used":u[FEATURE_COLUMNS].to_dict(),"recommendations":unique[:3]}

class UserProfile(BaseModel):
    age: int
    gender: str
    occupation: str
    education_level: str
    device_type: str
    daily_usage_hours: float

@app.post("/recommend")
async def recommend_user(p: UserProfile):
    if kproto is None:
        raise HTTPException(status_code=500, detail="kproto model is not loaded on server.")
    user_clean = {
        "age": float(p.age),
        "gender": str(p.gender),
        "occupation": str(p.occupation),
        "education_level": str(p.education_level),
        "device_type": str(p.device_type),
        "daily_usage_hours": float(p.daily_usage_hours),
    }
    user_vec = to_kproto_vector(user_clean)
    user_np = np.array([user_vec], dtype=object)
    cluster = int(kproto.predict(user_np, categorical=CATEGORICAL_IDX)[0])
    cluster_users = df_users[df_users["cluster"] == cluster]
    if cluster_users.empty:
        return {"mode":"input_user","cluster":cluster,"user":p.dict(),"recommendations":[],"reason":"No users found in this cluster"}
    templates = []
    for row in cluster_users["template"]:
        if row is None:
            continue
        if isinstance(row, str):
            try:
                row = json.loads(row)
            except:
                continue
        if isinstance(row, dict):
            row = [row]
        if isinstance(row, list):
            for item in row:
                if isinstance(item, dict):
                    templates.append(item)
    if not templates:
        return {"mode":"input_user","cluster":cluster,"user":p.dict(),"recommendations":[],"reason":"Cluster has no templates"}
    seen = set()
    unique = []
    for t in templates:
        nm = t.get("name","").strip().lower()
        if nm and nm not in seen:
            seen.add(nm)
            unique.append(t)
    return {"mode":"input_user","cluster":cluster,"user":p.dict(),"recommendations":unique[:3]}

# ==========================================================
# RUN
# ==========================================================
if __name__ == "__main__":
    # Bind to loopback only — this server is for the desktop app on this machine.
    host = os.getenv("LYFO_HOST", "127.0.0.1")
    port = int(os.getenv("LYFO_PORT", "8000"))

    # Frozen builds must pass the app object (no "main:app" import string) and
    # must not enable reload, which respawns via sys.argv and breaks.
    if IS_FROZEN:
        uvicorn.run(app, host=host, port=port, log_level="info")
    else:
        uvicorn.run("main:app", host=host, port=port, reload=True)
