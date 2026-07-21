# DevLog v2 — Daily Work Tracker + AI Coach

A full-stack app to track your daily dev work and get AI-powered productivity insights.

```
devlog/
├── backend/                ← FastAPI Python server
│   ├── main.py
│   └── requirements.txt
├── frontend/               ← React + Vite app
│   ├── src/
│   │   ├── pages/          (LogPage, SummaryPage, AnalysePage, WeeklyPage)
│   │   ├── components/     (LogEntryCard, EntryForm, StatsBar)
│   │   ├── api/            (client.js, constants.js)
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .env.example             ← Single env template for both backend & frontend
└── README.md
```

---

## ⚙️ Setup

### 0. Environment variables (single .env at project root)

Copy the template at the project root:
```bash
cp .env.example .env
# Then edit .env with your keys
```

This single `.env` file serves both backend and frontend.

---

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
```

Start:
```bash
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

---

### 2. Frontend

```bash
cd frontend
npm install
```

Start:
```bash
npm run dev
```

Open: http://localhost:5173

---

## 📋 Features

### Daily Log (/)
- Log entries with category, title, description, duration, outcome, priority, tags
- Filter by category
- Edit and delete entries
- Pick any past date

### Summary (/summary)  ← AI
- End-of-day digest: headline, standup one-liner
- Energy score, time breakdown (focused/meetings/reviews)
- Highlights and blockers
- Standout task + tomorrow's focus

### Analysis (/analyse)  ← AI
- Productivity score 0–100
- What went well / wrong (with evidence)
- Patterns detected (context switching, interruptions)
- Improvement suggestions with concrete actions
- Skills used today
- Coaching note + tomorrow's priority

### Weekly (/weekly)  ← AI
- Activity chart (last 7 days)
- Select any dates for multi-day analysis
- Week score, trend (improving/stable/declining)
- Best day / toughest day
- Recurring blockers and weekly patterns
- Next week recommendation

---

## 🗂️ Categories

| Icon | Category | Use for |
|------|----------|---------|
| ⌥ | PR Review | Code reviews |
| 🚀 | Rollout | Deployments |
| ◎ | Meeting | Standups, syncs |
| ⟁ | Metrics | Dashboards |
| ⌘ | Comments | PR/issue responses |
| ◈ | Dev Task | Feature work, bugs |
| ⚡ | Incident | On-call, outages |
| ◦ | Other | Misc |

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | /logs?day=YYYY-MM-DD | Get logs for a day |
| POST   | /log | Add entry |
| PUT    | /log/{id} | Update entry |
| DELETE | /log/{id} | Delete entry |
| GET    | /logs/dates | All logged dates |
| GET    | /logs/stats?day=... | Stats for a day |
| POST   | /note | Save daily note |
| GET    | /note/{day} | Get daily note |
| POST   | /ai/summarise | AI end-of-day summary |
| POST   | /ai/analyse | AI productivity analysis |
| POST   | /ai/weekly | AI weekly trends |
