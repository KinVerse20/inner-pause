# Chakra Healing MVP

Mobile-first Chakra Healing app: an emotional journal that turns a daily reflection into a reviewed emotional analysis, a personalised chakra-based healing plan, sequential local audio playback, and post-session feedback.

Brand line: **Heal Within. Live Aligned.**

## What works now

- Three-step onboarding
- Home dashboard
- Journal entry with text, save modes, intensity before session, and mock voice capture
- Server-side `/api/analyze` route with Zod validation
- Deterministic non-AI fallback when `OPENAI_API_KEY` is missing
- Emotional analysis review/edit flow
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

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Environment variables

Copy `.env.example` to `.env.local` and fill only the services you want to enable.

Required for OpenAI analysis:

```text
OPENAI_API_KEY
OPENAI_MODEL
```

Required for Supabase production persistence/auth:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
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

## Supabase setup

Migration:

```text
supabase/migrations/202608020001_chakra_healing_mvp.sql
```

It creates:

- `profiles`
- `journal_entries`
- `emotional_analyses`
- `healing_sessions`
- `session_feedback`
- `user_patterns`
- `morning_guidance`
- `audio_tracks`
- `subscriptions`

The migration includes foreign keys, indexes, updated-at triggers, RLS, ownership policies, and seed audio-track records.

## Audio files

The MVP uses existing reusable local files:

```text
public/audio/root.mp3
public/audio/sacral.mp3
public/audio/solar-plexus.mp3
public/audio/heart.mp3
public/audio/throat.mp3
public/audio/third-eye.mp3
public/audio/crown.mp3
```

Current MP3s should be treated as placeholder/development audio unless you have production licenses. Replace them with licensed production audio before commercial launch.

## Deployment

1. Push the repository to GitHub or connect the project directly to Vercel.
2. Add environment variables in Vercel Project Settings.
3. Run Supabase migrations against the production Supabase project.
4. Upload licensed audio to the intended storage location or keep files in `public/audio`.
5. Deploy with Vercel.

Build command:

```bash
npm run build
```

## Mocked until credentials are supplied

- Supabase auth/database client wiring
- Google OAuth and password reset email delivery
- WhatsApp delivery provider
- Billing provider
- Real speech-to-text transcription
- Production licensed audio catalogue

The local MVP avoids broken primary actions by using localStorage and safe mock providers where external credentials are absent.
