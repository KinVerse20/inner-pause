# The InnerPause MVP

Mobile-first reflective wellness app: a private journal that turns a daily reflection into a reviewed emotional insight, a personalised healing plan, sequential local audio playback, and post-session feedback.

Brand line: **Heal Within. Live Aligned.**

## What works now

- Three-step onboarding
- Home dashboard
- Journal entry with text, save modes, intensity before session, and mock voice capture
- Server-side analysis and Tell routing on the separate backend (`backend/`, `/api/analyze` and `/api/tell-interpret`)
- Deterministic fallback insight when `OPENAI_API_KEY` is missing
- Emotional insight review/edit flow
- Safety interruption for crisis-like wording
- Personalised healing-plan timeline
- Sequential audio player using reusable local MP3 files
- Post-session feedback and before/after comparison
- Journal history
- Insights dashboard
- Mock WhatsApp morning guidance provider
- Mock premium/billing provider
- Profile and preference screen
- PWA manifest/service worker from the existing project
- Local persistence for development and personal testing

## Local development

This repo is split into three packages:

```text
frontend/   Next.js UI (port 3000)
backend/    API server (port 4000)
shared/     schemas and deterministic routing used by both
```

```bash
npm install
npm run dev
```

That starts the API and the UI together. Open:

```text
http://localhost:3000
```

The UI keeps calling `/api/*` on the same origin. Next.js rewrites those requests to the backend (`API_URL`, default `http://localhost:4000`).

Run one side only:

```bash
npm run dev:frontend
npm run dev:backend
```

## Environment variables

Copy `.env.example` to `.env.local` at the repo root. Both apps read it: the backend loads `../.env.local`, and the frontend Next config loads the same file.

Required for the optional external insight service:

```text
API_URL=http://localhost:4000
OPENAI_API_KEY
OPENAI_MODEL
NEXT_PUBLIC_APP_URL
```

Required for MongoDB auth and accounts:

```text
MONGODB_URI
AUTH_SECRET
```

Optional provider placeholders:

```text
WHATSAPP_PROVIDER
META_WHATSAPP_ACCESS_TOKEN
META_WHATSAPP_PHONE_NUMBER_ID
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_WHATSAPP_FROM
BILLING_PROVIDER
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
```

## MongoDB setup

Auth accounts are stored in MongoDB (`users` collection) using `MONGODB_URI`. The database name in the URI is used as-is. No SQL migrations are required.

Copy `.env.example` to `.env.local` and set:

```text
MONGODB_URI
AUTH_SECRET
```

## Audio files

The MVP uses existing reusable local files:

```text
frontend/public/audio/root.mp3
frontend/public/audio/sacral.mp3
frontend/public/audio/solar-plexus.mp3
frontend/public/audio/heart.mp3
frontend/public/audio/throat.mp3
frontend/public/audio/third-eye.mp3
frontend/public/audio/crown.mp3
```

Current MP3s should be treated as placeholder/development audio unless you have production licenses. Replace them with licensed production audio before commercial launch.

## Deployment

The UI and API are separate apps.

Frontend (Vercel or Amplify):

1. Set the project root to the repository root so workspaces resolve.
2. Build command: `npm run build`
3. Output: `frontend/.next`
4. Set `API_URL` to the deployed backend origin.

Backend:

1. Run `npm run start -w @inner-pause/backend` (or deploy the `backend/` package).
2. Set `PORT`, `FRONTEND_ORIGIN`, `MONGODB_URI`, `AUTH_SECRET`, and `OPENAI_API_KEY` if used.

Auth cookie exchange stays on the frontend at `/auth/confirm`. All other `/api/*` routes live on the backend.

## Mocked until credentials are supplied

- Google OAuth and password reset email delivery
- WhatsApp delivery provider
- Billing provider
- Real speech-to-text transcription
- Production licensed audio catalogue

The local MVP avoids broken primary actions by using localStorage and safe mock providers where external credentials are absent.
