"""
DevLog Backend — FastAPI
Install: pip install fastapi uvicorn python-dotenv psycopg2-binary
Run:     uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import json, os
import urllib.request
import urllib.error
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="DevLog API", version="2.0.0")

# CORS configuration
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── PostgreSQL connection ─────────────────────────────────────────────────────

def get_conn():
    return psycopg2.connect(os.getenv("DATABASE_URL"), sslmode="require")

def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            category TEXT,
            title TEXT,
            description TEXT DEFAULT '',
            duration_minutes INTEGER,
            tags TEXT DEFAULT '[]',
            outcome TEXT DEFAULT 'done',
            date TEXT,
            priority TEXT DEFAULT 'medium'
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS notes (
            date TEXT PRIMARY KEY,
            content TEXT,
            created_at TEXT,
            updated_at TEXT
        )
    """)
    conn.commit()
    cur.close()
    conn.close()

# Initialize DB on startup
init_db()

# ── Models ───────────────────────────────────────────────────────────────────

class LogEntry(BaseModel):
    id: Optional[str] = None
    timestamp: Optional[str] = None
    category: str
    title: str
    description: Optional[str] = ""
    duration_minutes: Optional[int] = None
    tags: Optional[List[str]] = []
    outcome: Optional[str] = "done"
    date: Optional[str] = None
    priority: Optional[str] = "medium"

class DailyNote(BaseModel):
    date: str
    content: str

class AiRequest(BaseModel):
    date: str
    entries: List[dict]

# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "DevLog API v2 running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"ok": True}

# ── Log CRUD ─────────────────────────────────────────────────────────────────

@app.post("/log", status_code=201)
def add_log(entry: LogEntry):
    entry.id = f"log_{int(datetime.utcnow().timestamp() * 1000)}"
    entry.timestamp = datetime.utcnow().isoformat()
    entry.date = entry.date or date.today().isoformat()

    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        INSERT INTO logs (id, timestamp, category, title, description, duration_minutes, tags, outcome, date, priority)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        entry.id, entry.timestamp, entry.category, entry.title,
        entry.description, entry.duration_minutes,
        json.dumps(entry.tags), entry.outcome, entry.date, entry.priority
    ))
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True, "entry": entry.dict()}

@app.get("/logs")
def get_logs(day: Optional[str] = None):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if day:
        cur.execute("SELECT * FROM logs WHERE date = %s ORDER BY timestamp DESC", (day,))
    else:
        cur.execute("SELECT * FROM logs ORDER BY timestamp DESC")
    logs = [dict(r) for r in cur.fetchall()]
    for l in logs:
        if isinstance(l.get("tags"), str):
            l["tags"] = json.loads(l["tags"])
    cur.close()
    conn.close()
    return {"logs": logs, "total": len(logs)}

@app.get("/logs/dates")
def get_dates():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT date FROM logs ORDER BY date DESC")
    dates = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    return {"dates": dates}

@app.get("/logs/stats")
def get_stats(day: Optional[str] = None):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    if day:
        cur.execute("SELECT * FROM logs WHERE date = %s", (day,))
    else:
        cur.execute("SELECT * FROM logs")
    logs = [dict(r) for r in cur.fetchall()]
    cur.close()
    conn.close()

    cats = {}
    total_mins = 0
    outcomes = {"done": 0, "in_progress": 0, "blocked": 0}
    for l in logs:
        cats[l["category"]] = cats.get(l["category"], 0) + 1
        total_mins += l.get("duration_minutes") or 0
        o = l.get("outcome", "done")
        outcomes[o] = outcomes.get(o, 0) + 1
    return {
        "total": len(logs),
        "total_minutes": total_mins,
        "by_category": cats,
        "by_outcome": outcomes,
    }

@app.put("/log/{log_id}")
def update_log(log_id: str, entry: LogEntry):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, timestamp, date FROM logs WHERE id = %s", (log_id,))
    existing = cur.fetchone()
    if not existing:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Log not found")

    cur.execute("""
        UPDATE logs SET category=%s, title=%s, description=%s,
        duration_minutes=%s, tags=%s, outcome=%s, priority=%s
        WHERE id=%s
    """, (
        entry.category, entry.title, entry.description,
        entry.duration_minutes, json.dumps(entry.tags),
        entry.outcome, entry.priority, log_id
    ))
    conn.commit()
    cur.close()
    conn.close()
    entry.id = log_id
    return {"success": True, "entry": entry.dict()}

@app.delete("/log/{log_id}")
def delete_log(log_id: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM logs WHERE id = %s", (log_id,))
    if cur.rowcount == 0:
        cur.close()
        conn.close()
        raise HTTPException(status_code=404, detail="Log not found")
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}

# ── Daily Notes ──────────────────────────────────────────────────────────────

@app.post("/note")
def save_note(note: DailyNote):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT date FROM notes WHERE date = %s", (note.date,))
    existing = cur.fetchone()
    if existing:
        cur.execute(
            "UPDATE notes SET content=%s, updated_at=%s WHERE date=%s",
            (note.content, datetime.utcnow().isoformat(), note.date)
        )
    else:
        cur.execute(
            "INSERT INTO notes (date, content, created_at) VALUES (%s, %s, %s)",
            (note.date, note.content, datetime.utcnow().isoformat())
        )
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}

@app.get("/note/{day}")
def get_note(day: str):
    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cur.execute("SELECT * FROM notes WHERE date = %s", (day,))
    note = cur.fetchone()
    cur.close()
    conn.close()
    return {"note": dict(note) if note else None}

# ── AI: End-of-day Summary ───────────────────────────────────────────────────

@app.post("/ai/summarise")
def summarise_day(req: AiRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

    entries_text = _entries_to_text(req.entries)
    prompt = f"""You are a dev productivity coach. Below are all work log entries for {req.date}.

{entries_text}

Generate a concise end-of-day summary as JSON:
{{
  "headline": "One sentence summary of the day",
  "one_liner": "Short punchy standup-style update",
  "total_tasks": <number>,
  "highlights": ["top accomplishments (max 4)"],
  "blockers": ["things blocked or incomplete"],
  "time_breakdown": {{"focused_work_pct": <0-100>, "meetings_pct": <0-100>, "reviews_pct": <0-100>, "other_pct": <0-100>}},
  "energy_score": <1-10>,
  "standout_task": "The single most impactful thing done today",
  "tomorrow_hint": "One thing to prioritise tomorrow based on today"
}}

Return ONLY valid JSON."""

    raw = _call_groq(api_key, prompt)
    return json.loads(raw)

# ── AI: Productivity Analysis ────────────────────────────────────────────────

@app.post("/ai/analyse")
def analyse_day(req: AiRequest):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

    entries_text = _entries_to_text(req.entries)
    prompt = f"""You are a senior engineering productivity coach. Analyse this developer's worklog for {req.date}:

{entries_text}

Return deep, honest, actionable analysis as JSON:
{{
  "productivity_score": <0-100>,
  "productivity_label": "e.g. High Focus / Meeting Heavy / Fragmented / Deep Work Day",
  "what_went_well": ["specific observations with evidence from the log (max 4)"],
  "what_went_wrong": ["specific issues, blockers, missed outcomes (max 4)"],
  "patterns": ["behavioural patterns detected (max 3)"],
  "improvements": [
    {{"title": "short title", "why": "evidence from log", "action": "concrete next step"}}
  ],
  "focus_time_quality": "2-sentence assessment",
  "context_switching_score": <0-10>,
  "recommendation_for_tomorrow": "One specific prioritised action",
  "coaching_note": "2-sentence honest coaching observation",
  "skills_used": ["list of technical/soft skills demonstrated today"]
}}

Return ONLY valid JSON."""

    raw = _call_groq(api_key, prompt)
    return json.loads(raw)

# ── AI: Weekly Trends ────────────────────────────────────────────────────────

@app.post("/ai/weekly")
def weekly_analysis(dates: List[str]):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY not set")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    placeholders = ",".join(["%s"] * len(dates))
    cur.execute(f"SELECT * FROM logs WHERE date IN ({placeholders})", dates)
    all_logs = [dict(r) for r in cur.fetchall()]
    for l in all_logs:
        if isinstance(l.get("tags"), str):
            l["tags"] = json.loads(l["tags"])
    cur.close()
    conn.close()

    days_text = ""
    for d in dates:
        day_logs = [l for l in all_logs if l.get("date") == d]
        if day_logs:
            days_text += f"\n\n=== {d} ===\n"
            days_text += _entries_to_text(day_logs)

    if not days_text.strip():
        raise HTTPException(status_code=400, detail="No logs found for the requested dates")

    prompt = f"""Analyse this developer's work logs across multiple days:
{days_text}

Return a weekly analysis as JSON:
{{
  "overall_score": <0-100>,
  "best_day": "YYYY-MM-DD",
  "toughest_day": "YYYY-MM-DD",
  "weekly_patterns": ["recurring patterns across the week"],
  "top_categories": ["most time-consuming activity types"],
  "productivity_trend": "improving | stable | declining",
  "wins": ["biggest wins of the week"],
  "recurring_blockers": ["issues that came up more than once"],
  "next_week_focus": "Top recommendation for next week",
  "summary": "3-sentence week overview"
}}

Return ONLY valid JSON."""

    raw = _call_groq(api_key, prompt)
    return json.loads(raw)

# ── Helpers ───────────────────────────────────────────────────────────────────

def _entries_to_text(entries: list) -> str:
    return "\n".join([
        f"- [{e['category'].upper()}] {e['title']}: {e.get('description','')} "
        f"{'~' + str(e['duration_minutes']) + 'min' if e.get('duration_minutes') else ''} "
        f"[{e.get('outcome','?')}] priority:{e.get('priority','medium')} tags:{e.get('tags',[])}"
        for e in entries
    ])

def _call_groq(api_key: str, prompt: str) -> str:
    req = urllib.request.Request(
        "https://api.groq.com/openai/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "DevLog_Backend/1.0"
        },
        data=json.dumps({
            "model": "llama-3.3-70b-versatile",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.2
        }).encode("utf-8")
    )
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode("utf-8"))
            raw = data["choices"][0]["message"]["content"].strip()
            return raw.replace("```json", "").replace("```", "").strip()
    except urllib.error.HTTPError as e:
        err_out = e.read().decode("utf-8")
        print(f"Groq API Error: {err_out}")
        raise HTTPException(status_code=500, detail=f"AI provider error: {err_out}")