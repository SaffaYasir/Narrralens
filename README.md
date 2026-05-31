# 📡 NarraLens — AI-Powered Data Narrative Engine

**NarraLens** transforms your CSV/Excel datasets into professional written reports using Claude AI. Upload data → get an AI-written story, charts, statistics, anomalies, and an interactive chat assistant.

---

## 🆕 What's New in This Version

| Feature | Details |
|---|---|
| **Login & Signup** | User accounts with secure token auth — `/login` and `/signup` |
| **100MB file support** | Up from 50MB; large files are sampled efficiently |
| **Live insight badges** | Upload preview shows row count, column types, missing value alerts |
| **New branding** | "NarraLens" with 📡 icon |
| **Bigger insight cards** | Values now display in large, readable font |
| **Custom Story modal** | Choose tone, focus areas, detail level + custom instructions |
| **Better PDF layout** | Proper tables with headers, bigger cards, bold section lines, correlations table |
| **Faster chat** | Claude Haiku for chat (4–5× faster than Sonnet) |
| **Better chat formatting** | Markdown rendered properly with bold, bullets, code |
| **Lightweight chat analysis** | Skips IsolationForest for chat queries — much faster |

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+, Node.js 18+
- Anthropic API key

### Setup

```bash
# 1. Clone / extract
cd narrralens

# 2. Backend
cd backend
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
pip install -r requirements.txt
python app.py

# 3. Frontend (new terminal)
cd frontend
npm install
npm start
```

Open http://localhost:3000

---

## 📁 Project Structure

```
narrralens/
├── backend/
│   ├── app.py                  # Flask app, 100MB limit
│   ├── analysis_engine.py      # Stats, ML, charts (+ lightweight mode)
│   ├── ai_narrator.py          # Claude Sonnet (reports) + Haiku (chat)
│   ├── routes/
│   │   ├── auth.py             # Login / signup / JWT-style token auth
│   │   ├── upload.py           # File upload, efficient large file handling
│   │   ├── analyze.py          # Full analysis endpoint
│   │   ├── report.py           # PDF generation (improved layout)
│   │   └── chat.py             # Chat with lightweight analysis
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── context/AuthContext.js      # Auth state provider
    │   ├── pages/
    │   │   ├── HomePage.js             # Upload + live insight badges
    │   │   ├── ReportPage.js           # Dashboard + Custom Story button
    │   │   └── AuthPage.js             # Login / Signup
    │   └── components/
    │       ├── Navbar.js               # With user display + logout
    │       ├── InsightCard.js          # Bigger value font
    │       ├── ChatPanel.js            # Markdown rendering, Haiku
    │       ├── StoryPreferencesModal.js # Custom story UI
    │       ├── ChartBlock.js
    │       ├── StatsTable.js
    │       └── CorrelationTable.js
    └── package.json
```

---

## 🔑 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login`  | Login, get token |
| GET  | `/api/auth/me`     | Get current user |
| POST | `/api/upload`      | Upload CSV/Excel (up to 100MB) |
| GET  | `/api/analyze/:id` | Full analysis + narrative |
| GET  | `/api/report/:id`  | Generate default PDF |
| POST | `/api/report/:id`  | Generate custom PDF with preferences |
| POST | `/api/chat/:id`    | Ask questions (fast Haiku) |

---

## 💡 Tips
- **Large files (>10MB)**: Analysis samples 10K rows for chat; full data used for report
- **Custom story**: POST preferences `{tone, focus, detail, custom_note}` to report endpoint  
- **Auth is optional**: The tool works without login; accounts just enable future history features
