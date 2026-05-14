# Civic Tracker — Backend

FastAPI service that orchestrates report creation, AI verification, gamification, and the admin dashboard's read APIs.

## Stack

- **FastAPI** (Python 3.11+)
- **Supabase** (Postgres + PostGIS + Auth + Storage)
- **HuggingFace Space** (YOLOv8 pothole + garbage detectors) — verification source of truth
- **Gemini 2.5 Flash-Lite** — rich description / urgency / hazards for the admin view

## Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in keys
uvicorn app.main:app --reload
```

## Environment

| Var | What it's for |
|---|---|
| `SUPABASE_URL` / `SUPABASE_KEY` | anon-key client for user-scoped reads |
| `SUPABASE_SERVICE_ROLE_KEY` | privileged client for XP awards, stats updates |
| `GEMINI_API_KEY` | Gemini vision calls for report enrichment |
| `YOLO_SERVICE_URL` | the deployed `huggingface-space/` URL |
| `YOLO_SERVICE_TOKEN` | same value you set as `API_TOKEN` on the Space |
| `DEBUG` | flips log level to DEBUG |

See `.env.example` for the full list. Never commit `.env` — it's gitignored.

## Database

Migrations live in `../supabase/migrations/` (Supabase CLI project at repo root).

```bash
cd ..                                  # to repo root, where supabase/ lives
supabase link --project-ref <ref>      # once
supabase db push                       # applies pending migrations
```

## Verification flow

`POST /api/v1/reports/` is non-blocking:

1. Inserts the report with `status="Pending Review"` and no XP.
2. Fires a `BackgroundTasks` job (`_verify_report_async`).
3. Job hits `YOLO_SERVICE_URL/detect` with the photo URL.
4. YOLO match → `status="Verified"`, `_award(+25 XP, +2 rep)`.
5. YOLO miss → `status="Rejected"`, no XP.
6. Gemini runs alongside and stores `ai_analysis` jsonb for the admin dashboard. Never used to gate XP.

## Useful routes

| Method | Path | Notes |
|---|---|---|
| `POST` | `/api/v1/reports/` | submit, returns immediately |
| `GET` | `/api/v1/reports/` | list, filterable |
| `GET` | `/api/v1/reports/me` | own reports |
| `POST` | `/api/v1/reports/{id}/resolve` | mark resolved (officer-side) |
| `GET` | `/api/v1/users/me` | profile + stats |

## Local-dev sandbox shortcuts

- Pin the backend behind ngrok so the mobile app can hit a stable URL:
  `ngrok http 8000` → put the HTTPS URL in `frontend/.env`'s `EXPO_PUBLIC_API_URL`.
- The `supabase/` CLI directory is at the **repo root** (not under `backend/`), to avoid Python shadowing the installed `supabase` pip package.
