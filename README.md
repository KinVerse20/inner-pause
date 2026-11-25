# Inner Pause

A calm, sound-first app for the moments that ask something of you. You say
how you feel, Pause plays the right sound, and your Journey keeps the story.

**Start here if you're picking this up:** read [docs/HANDOFF.md](docs/HANDOFF.md).
It has every product decision, what's done, what's next, and the gotchas.

## The stack

An npm workspaces monorepo:

| Folder      | What it is |
|-------------|------------|
| `frontend/` | Next.js 16 (App Router, Turbopack). The whole UI. `/api/*` is rewritten to `API_URL`. Read `frontend/AGENTS.md` first: this Next has breaking changes. |
| `backend/`  | Yogesh's API: Node + [Hono](https://hono.dev) + MongoDB (official driver), run with `tsx`. Cookie sessions, Pass payments, Practice reminders, journal backup, sounds. |
| `shared/`   | Types and constants used by both (brand, prices, `PassState`). |

Main backend files: `backend/src/app.ts` (all routes), `src/index.ts` (server,
reminder scheduler, render worker), `src/mongo.ts` (connection and documents),
`src/routes/*`, `src/*-store.ts`.

### MongoDB collections

`users`, `pass_orders`, `push_subscriptions`, `journal_entries` (encrypted),
`app_content`, `sounds`, `sound_renders`. Indexes are created by the stores
on first use; there is no migration step.

## Run it locally

Needs **Node 24** and a MongoDB.

```
npm install
cp .env.local.example .env.local      # then fill in at least the two below
npm run dev                           # API on :4000, web on :3000
```

The backend reads `.env` / `.env.local` from `backend/` and from the repo root.

**Required**

- `MONGODB_URI`: any MongoDB. Atlas, a local `mongod`, or Docker
  (`docker run -p 27017:27017 mongo` then `mongodb://127.0.0.1:27017/inner-pause`).
- `AUTH_SECRET`: any long random string (signs session cookies).

**Optional, each feature stays off and says so plainly until set**

- `LOCAL_TEST_AUTH=true` and `NEXT_PUBLIC_LOCAL_TEST_AUTH=true`: one-tap test
  sign-in at `/local-test-sign-in`. Dev only; ignored in production.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: Practice reminders by
  web push. Generate with `npx web-push generate-vapid-keys`.
- `JOURNAL_ENCRYPTION_KEY`: private journal backup (AES-256-GCM). Generate with
  `openssl rand -base64 32`. Changing it makes existing backups unreadable.
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`: the
  Inner Pause Pass, ₹999 once, for life. `rzp_test_` keys for testing.
- `SMTP_*`, `MAIL_FROM`: password reset emails. In dev the link is logged.
- `OPENAI_API_KEY`: "Tell" interpretation.
- `S3_*`: sound storage. Empty keeps files on local disk.

**Ports taken?** Run the parts separately, for example:

```
PORT=4300 FRONTEND_ORIGIN=http://localhost:3100 npm run dev:backend
cd frontend && API_URL=http://localhost:4300 npx next dev --port 3100
```

## Tests

```
npm test            # backend (tsx --test) and frontend (node --test)
npm run lint
npm run build
```

The Mongo integration tests (push sender, journal store) run only when
`TEST_MONGODB_URI` points at a throwaway database; otherwise they skip.
`npm run test:ui` is out of date (walks old routes) and is due a rewrite in
the final QA phase.

## Going live

See [docs/LAUNCH.md](docs/LAUNCH.md) and `deploy/ec2/` (Caddy, systemd unit,
deploy script, production env example).
