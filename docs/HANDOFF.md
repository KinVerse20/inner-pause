# Session handoff — Inner Pause UI unification

Last updated: 2026-11-25. Read this first in a new session, then continue from "Next up".

## Where things are

- Branch: `feature/our-ui-unification` (local only, **not pushed**). Base: `554815e` (Yogesh's latest on `feature/aws-full-stack-test`).
- 31 commits so far (`536ca7e` … `7077638`). Working tree clean.
- Kinverse's branch `origin/feature/practice-guided-breathing-mindspace` (`010bc18`) is fetched but **never merged** — it overwrites the rebuild with an old app. Port features from it only.

## Decisions already made (don't re-ask)

- **Precedence:** our design (docs/BRAND_IDENTITY, DESIGN_SYSTEM, FOUNDATION, founder mockups) wins; keep every Yogesh ("devylogic") and Kinverse feature, but **rewrite their copy in our app voice** (DESIGN_SYSTEM §14: calm, plain, second person, no dashes).
- **Practice = only Kinverse's 5 fourteen-day paths**, renamed: Confidence, Uncertainty, Focus, Emotional Regulation, Rest. Old 7 skills retired from Practice.
- **Journey is the journal** (the app's core idea): story timeline, keepsake cards, Moment polaroids.
- **Color:** soft tint washes allowed (BRAND_IDENTITY §4.4 revised); gold `#E0A868` is the celebration color.
- **Yogesh's frontend admin retired.** Not porting Kinverse's AWS admin control room.
- **Backend: build on Yogesh's** (Node + Hono + MongoDB on one EC2; Razorpay Pass). Port from Kinverse: web-push reminders, optional journal cloud sync, tests.
- Audio stays in the repo for now; move to object storage + CDN (S3/R2) **before public launch** (one base URL in `lib/sound-library.ts`).
- Player stays quiet: no "Read more" link inside it; Apple/Google sign-in hidden until wired.

## Parked by the founder (2026-11-25)

- **Safety card on writing paths** (Home Tell, Moments letting out, Journey journal): detect crisis words and show a calm card with a helpline (e.g. Tele-MANAS 14416) before any Pause. Proposed, then parked by the founder for now. Note: letting it out in Moments now invites venting, and the only crisis check in the code is in the unused `/api/analyze` path.

## Decisions from the founder review round (2026-11-25)

- Pass is **₹999 once, for life** (incl. future Pass features). Deeper analysis stays (it runs on the device, no AI cost).
- Tab bar: **Home · Moments · [Pause] · Practice · You**. The You tab is your Journey diary (`/journey`, header with avatar and name); settings (`/profile`, titled Settings) sit behind its gear. Home has no avatar and no big-moments link (Moments is a tab).
- Moments: **let it out first** (speak/write, sound already playing, no analysis), saved as the Moment's polaroid words.
- Journey is a scrolling diary (month trail, Pause stamps); Home tiles use illustrated emblems.

## Open question for the user

- Should the Inner Pause Pass gate Practice? Today all 5 paths are free; Pass copy only promises deeper Journey insight. (Option: first path or first 3 days free.)

## Next up (agreed plan)

1. ~~Phase 3~~ done (2026-11-23): Kinverse intro is an optional "How it works" sheet on Entry (not a gate, PRODUCT_FLOW §39.A) plus "I have an account"; dev-only test sign-in at `/local-test-sign-in`.
2. ~~Phase 4~~ done (2026-11-25): tap-to-expand view transitions (see "Motion notes" below).
3. ~~Phase 5~~ done (2026-11-25): 14 legacy routes + screens and the old 7-skill Practice modules deleted (45 files). Journey highlights / Growth now read the 5 paths; Data & Privacy still exports/deletes old skill records by key; `/about` rebuilt in our design. **Left for a decision** (unreferenced, kept on purpose): `install-pwa-prompt`, `help-tooltip`, `chakra-inspiration-tag` + `lib/practice-paths.ts` (FOUNDATION chakra tag), `chakra-visual/symbol/path-ui`, `lotus-visual`, `waveform-face`, `lib/providers/*`, `ai-schemas`, `insights`, `use-app-preferences`, `use-mvp-state`, `use-progress-store`. Also: the old global `PlayerProvider` is still in `app/layout.tsx` but inert (only the deleted screens started it; `pwa-registration` reads its isPlaying); `/auth/reset-password` is still the old gold design.
4. ~~Phase 6~~ done (2026-11-25), on Yogesh's backend: `@hono/node-server` 2.1.11 (audit clean); admin endpoints + role retired (public content/sound reads and the render worker kept); app built by `createApp()` (`src/app.ts`) so tests call it in-process; **Practice reminders by web push** (`routes/practice.ts`, `push-store.ts`, `push-scheduler.ts`, `reminders.ts`; client `lib/programme-notifications.ts`), off until `VAPID_*` set; **optional private journal backup** (`routes/journal.ts`, `journal-store.ts` AES-256-GCM; client `lib/journal-sync.ts`, Data & Privacy toggle), off until `JOURNAL_ENCRYPTION_KEY` set. Not done here: `POST /api/analyze` is now uncalled (Yogesh's AI analysis; the screens that used it were deleted), kept for a decision.
5. **Phase 7 — final QA:** rewrite `npm run test:ui` (scripts/mobile-usability-test.mjs still walks the deleted prototype flow: /onboarding → /journal → /analysis …); click through every flow in light + dark, `next build`, eslint, contrast, reduced motion, `npm run test:ui`.

## How to test (the user wants real click-through testing, not just screenshots)

- Dev server: `cd frontend && npx next dev --port 3100`. If `EADDRINUSE`, a stale Next node process holds 3100 — find it with PowerShell `Get-NetTCPConnection -LocalPort 3100` and stop it.
- Click harness: scratchpad `shots/shoot.mjs` (playwright-core + system Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--autoplay-policy=no-user-gesture-required`, 390×844). Steps: `goto:/x`, `role:button|Name`, `role:tab|Name`, `clickSel:css`, `eval:js`, `wait:ms`, `shot:name`, `full:name`. Recreate it if the scratchpad was cleared.
- Entry gate: first visit `/entry` → click "Begin".
- Signed-in testing without real Mongo: in scratchpad `mongo/`, `npm i mongodb-memory-server@10` and run a script that does `MongoMemoryServer.create({ instance: { port: 27018 } })`. Start the backend with `MONGODB_URI=mongodb://127.0.0.1:27018/innerpause-test AUTH_SECRET=<anything> LOCAL_TEST_AUTH=true PORT=4000 npx tsx src/index.ts`, and the frontend with `API_URL=http://localhost:4000 NEXT_PUBLIC_LOCAL_TEST_AUTH=true npx next dev --port 3100`. Then `/local-test-sign-in` → "Enter as test listener". (Docker Desktop is installed but its daemon is usually off.)
- Unit tests: `npm test` at the root (node --test, in `frontend/tests` and `backend/tests`).
- Checks before each commit: `npx tsc --noEmit -p .` and `npx eslint <files>` in `frontend/`.

## Backend notes (Phase 6)

- Tests: `npm test` (root) runs frontend + backend (`tsx --test`). Database tests skip unless `TEST_MONGODB_URI` points at a throwaway DB (e.g. the in-memory Mongo on 27018).
- Real push delivery can't be proven on this machine: Chrome here can't reach Google's push service (subscribe stalls), and headless/incognito Chrome has no Push API. The sender is proven by `backend/tests/push-sender.integration.test.mjs` (stand-in HTTPS push service, payload decrypted). Verify a real reminder on the deployed HTTPS site.
- **Ports on this machine:** 4000 is another project ("Dustech" backend), 4100 is a VM. Run our backend on **4300** (`PORT=4300`, frontend `API_URL=http://localhost:4300`).

## Motion notes (Phase 4)

- `lib/view-transition.ts` + "View transitions" block at the end of `app/globals.css`. Shared names pair a tapped thing with what it opens (`expand-<cardId>`, `moment-mode-*`, `entry-*`, `polaroid-*`, `title-<path>`).
- React only animates **pairs** reliably here: an unpaired `enter`/`exit` on a wrapper never fired. So page content is named by CSS only while `markPageTransition("forward"|"back"|"hold")` marks `<html>`; don't wrap page content in a named `<ViewTransition>` (it drops the page out of every other transition).
- In dev the first tap on a never-visited route won't morph (no prefetch in dev, the route suspends). Production prefetches the player from the tab bar; verified there.
- **Dev server gotcha:** files written by scripts (python/sed) were sometimes not picked up by Turbopack's watcher, and `.next/dev` served stale CSS even after restart. Edit with the editor tool, or stop the server and delete `frontend/.next/dev`.
- **Port gotcha:** stopping the background `next` task can leave its node process on 3100; free it with PowerShell `Get-NetTCPConnection -LocalPort 3100`.

## Key files added in this effort

- Design system: `frontend/app/globals.css` (`--ds-*` tokens, `.ds-tap` press system, type scale, app-glow, journal paper, polaroid, outcome-tile, sheets).
- Feedback: `lib/haptics.ts`. Breathing: `components/breathing-guide.tsx`.
- Sound: `lib/sound-library.ts`, `components/sound-sheet.tsx`, `public/audio/sounds/*`, `public/audio/chakras/*`.
- Practice: `lib/programme-data.ts`, `lib/programme-storage.ts`, `lib/programme-notifications.ts`, `lib/practice-path-presentation.ts`, `components/practice-path-screen.tsx`; push handlers in `public/sw.js`.
- Journey: `components/journey-story.tsx`. Home motifs: `components/tile-motif.tsx`.
- Motion: `lib/view-transition.ts`, `react-canary.d.ts`.
- Entry intro: `components/entry-intro-sheet.tsx`. Test sign-in: `backend/src/auth/local-test.ts`, `frontend/lib/local-test.ts`, `components/local-test-sign-in.tsx`.
- Knowledge: `lib/chakra-guide.ts`, `components/chakra-guide-screen.tsx`, `/chakras`, `/chakras/[chakraId]`.
- Moments: Kinverse moments merged into `lib/big-moment-engine.ts`. Tell feelings: `shared/src/tell.ts` (`EMOTION_WEIGHTS`).
