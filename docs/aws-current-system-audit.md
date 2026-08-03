# The InnerPause current system audit

Date: 2026-08-03  
Branch audited: `feature/aws-full-stack-test`  
Safety tag: `pre-aws-migration-safe`

## Current application

The repository is a Next.js App Router application named `the-innerpause`.

Core stack:

- Next.js 16.2.10
- React 19.2.4
- TypeScript
- Tailwind CSS 4 via PostCSS
- Supabase Auth and database clients
- OpenAI Responses API route with deterministic fallback
- PWA manifest and service worker
- Local MP3 audio files in `public/audio`
- Local MVP state in `localStorage`

## Current product areas present

- Onboarding
- Auth and reset-password screens
- Home dashboard
- Journal entry
- Emotional insight review/edit flow
- Personalised healing-plan flow
- Full audio player and session feedback
- Journal history
- Insights
- Profile/preferences
- PWA install/offline support
- Chakra journey screens and local Chakra audio playback

## Current routes

Primary app routes:

- `/`
- `/onboarding`
- `/auth`
- `/auth/confirm`
- `/auth/reset-password`
- `/journal`
- `/analysis`
- `/healing`
- `/healing/player`
- `/feedback`
- `/history`
- `/insights`
- `/guidance`
- `/profile`
- `/about`
- Chakra journey routes under `/session/[chakraId]/[sessionId]`

API routes:

- `/api/analyze`
- `/api/profile`
- `/api/profile/signup`

## Current authentication

Supabase Auth is wired through:

- `lib/supabase/browser.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `lib/supabase/config.ts`
- `components/auth-session-sync.tsx`
- `proxy.ts`

The app uses Supabase session cookies on protected routes when Supabase public env vars are configured. Without those vars, the proxy allows local UI testing and the app uses local state.

Current confirmation redirect:

- `https://chakra-healing-app-three.vercel.app/auth/confirm`

## Current database

Supabase migration:

- `supabase/migrations/202608020001_chakra_healing_mvp.sql`

Tables:

- `profiles`
- `journal_entries`
- `emotional_analyses`
- `healing_sessions`
- `session_feedback`
- `user_patterns`
- `morning_guidance`
- `audio_tracks`
- `subscriptions`

RLS is enabled for user-owned tables. Audio tracks are publicly readable when active.

## Current storage and audio

The current app uses local static audio files:

- `/audio/root.mp3`
- `/audio/sacral.mp3`
- `/audio/solar-plexus.mp3`
- `/audio/heart.mp3`
- `/audio/throat.mp3`
- `/audio/third-eye.mp3`
- `/audio/crown.mp3`

No production object-storage integration is currently required for the UI to work.

## Current background jobs and external providers

Implemented or planned integrations:

- Insight generation via `/api/analyze`
- Deterministic fallback when `OPENAI_API_KEY` is unavailable
- Mock WhatsApp morning guidance state
- Mock premium/billing state

There is no active queue, worker, scheduler, or external messaging deployment in this repository today.

## Current deployment

The repository contains a Vercel project directory and PWA assets. Current production reference used by auth redirect:

- `https://chakra-healing-app-three.vercel.app`

This AWS test branch does not change Vercel or Supabase production resources.

## Risks to protect during AWS testing

- Do not point production auth callbacks at Cognito until a separate test domain is ready.
- Do not migrate or overwrite the production Supabase database.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` or future AWS secrets in frontend code.
- Keep local static MP3 playback working while S3 support is added behind a provider boundary.
- Keep deterministic fallback behavior so UI testing is not blocked by optional external credentials.

