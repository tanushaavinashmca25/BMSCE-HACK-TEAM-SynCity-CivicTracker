# Civic Tracker — Mobile App

React Native (Expo SDK 54) app for iOS + Android. Users capture a photo of a civic issue, the backend verifies it with YOLOv8 via a HuggingFace Space, and verified reports earn XP.

## Stack

- **Expo SDK 54** (new architecture enabled)
- **react-native-vision-camera** for capture
- **Supabase JS** with `AsyncStorage` session persistence (RN — required, not optional)
- **react-navigation v7** native-stack + bottom-tabs
- **Skia** for any overlay rendering (currently just the GPS HUD)

> Note: this app **does not** run on-device ML. YOLO inference happens server-side on a HuggingFace Space. The previous `react-native-fast-tflite` + on-device YOLOv8 path was removed because (1) cold-start was 10-15 s, (2) garbage false-positives were unfixable client-side, (3) bundle was ~30 MB heavier.

## Setup

```bash
cd frontend
npm install
cp .env.example .env       # fill in EXPO_PUBLIC_* keys
cd ios && pod install && cd ..
npx expo run:ios           # or run:android
```

## Environment

| Var | What it's for |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (safe to ship to clients) |
| `EXPO_PUBLIC_API_URL` | base URL of the FastAPI backend (e.g. ngrok HTTPS URL in dev) |

See `.env.example`. `EXPO_PUBLIC_*` is Expo's prefix that exposes the var to JS at build time.

## Project structure

```
src/
  navigation/AppNavigator.tsx     # auth + onboarding + main tab gating
  screens/
    AuthScreen.tsx                # email OTP
    OnboardingScreen.tsx          # one-time profile setup
    MainTabs.tsx                  # home, leaderboard, profile, etc.
    CameraScreen.tsx              # capture + GPS HUD (lazy-loaded via Suspense)
    ReportScreen.tsx              # category + description, uploads to Storage
    ReportDetailScreen.tsx
  services/
    supabase.ts                   # createClient<Database>, AsyncStorage, polyfill
    api.ts                        # fetch wrapper for the FastAPI backend
    database.types.ts             # generated via `supabase gen types typescript`
  components/CameraLoading.tsx    # branded loading state used by Suspense + camera
  hooks/, utils/, theme/
```

## Auth flow

Email-only OTP via Supabase. AuthScreen has two stages: collect email → request OTP → enter 6-digit code → verify. The email template is set in `supabase/templates/magic_link.html` to render `{{ .Token }}` instead of a magic link.

## Camera flow

`CameraScreen` is lazily imported so the Vision Camera native module + permission prompts don't slow app start.

1. Lazy import (Suspense fallback shows the branded `CameraLoading` view).
2. Request camera + location permissions.
3. Subscribe to `Location.watchPositionAsync` and surface a live GPS pill at the top-center.
4. Capture → navigate to `ReportScreen` with `photoUri` + `location`.

`ReportScreen` then:
- Uploads the photo to Supabase Storage (`report-photos` bucket, path `<uid>/<timestamp>.<ext>`).
- POSTs `image_url` + `image_path` to the FastAPI backend.
- Shows **"Submitted for review."** No XP shown here — that's awarded after backend verification.

## Database types

To regenerate after a migration:

```bash
cd ../   # repo root
supabase gen types typescript --linked > frontend/src/services/database.types.ts
```

## Rebuilds

- Add/remove a native module → `cd ios && pod install && cd ..` then `npx expo run:ios --no-build-cache`.
- Cache-cleared metro reload → `npx expo start --clear`.
