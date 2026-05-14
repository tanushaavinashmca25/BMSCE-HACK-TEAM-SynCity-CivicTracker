# Civic Tracker

Crowd-sourced civic-issue reporting with AI verification. Citizens report potholes / garbage / utility faults; a YOLOv8 service decides if the photo actually shows what the user claims, and verified reports are routed to municipal officers via a dashboard.

```
mobile (Expo) ──▶ FastAPI ──▶ HuggingFace Space (YOLOv8 + Gemini)
     │              │                          │
     │              └──▶ Supabase (DB + Auth + Storage)
     │                          ▲
     │                          │
     └─ photo upload ───────────┘
```

## Repo layout

| Directory | What it is |
|---|---|
| `frontend/` | Expo / React Native app (iOS + Android). Captures photo, uploads to Supabase Storage, submits report. |
| `backend/` | FastAPI service. Creates reports, dispatches background verification, exposes leaderboards/profiles to the mobile + admin clients. |
| `admin/` | Next.js dashboard for municipal officers. |
| `huggingface-space/` | Dockerized FastAPI deployed to HF Spaces that runs the two YOLOv8 detectors and returns JSON. Backend's source of truth for verification. |
| `ml/` | Training scripts + Colab notebooks for the pothole + garbage YOLOv8 models. |
| `supabase/` | Supabase CLI project — migrations, config, email templates. |

## Quick start

### 1. Database (Supabase)
Apply migrations to your linked Supabase project.

**Windows:**
```powershell
npx supabase link --project-ref <ref>
npx supabase db push
```

**macOS/Linux:**
```bash
supabase link --project-ref <ref>
supabase db push
```

### 2. Backend
**Windows:**
```powershell
cd backend
py -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload
```

**macOS/Linux:**
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

### 3. Frontend
```bash
cd ../frontend
npm install
# Copy .env.example to .env and fill in EXPO_PUBLIC_* keys
npx expo run:ios       # or run:android
```

### 4. Admin (optional)
```bash
cd ../admin
npm install
# Copy .env.example to .env.local and fill in NEXT_PUBLIC_* keys
npm run dev
```

YOLO inference runs on the HuggingFace Space (`huggingface-space/`). It's already deployed at `https://arjun-vegeta-civic-yolo.hf.space`. See `huggingface-space/README.md` for redeploy.

To retrain the detectors, see `ml/README.md` (free Colab T4, ~30-60 min).

## Verification flow

1. User snaps a photo, picks a category, hits **Submit**.
2. Photo uploads to Supabase Storage (`report-photos` bucket).
3. `POST /api/v1/reports/` returns immediately with `status="Pending Review"`. **No XP yet.**
4. A FastAPI BackgroundTask hits the HF Space's `/detect` endpoint with the photo URL.
5. YOLO confirms or denies the claimed category. Gemini runs in parallel to enrich the report with description / urgency / hazards for the admin dashboard — never used to gate XP.
6. On YOLO match → `status="Verified"`, +25 XP, +2 reputation.
7. On miss → `status="Rejected"`, no XP.
