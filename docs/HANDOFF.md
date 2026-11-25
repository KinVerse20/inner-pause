# Session handoff — Inner Pause UI unification

Last updated: 2026-11-25. Read this first in a new session, then continue from "Next up".

## Where things are

- Branch: `feature/our-ui-unification` (local only, **not pushed**). Base: `554815e` (Yogesh's latest on `feature/aws-full-stack-test`).
- 24 commits so far (`536ca7e` … `2ad0275`). Working tree clean.
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

## Open question for the user

- Should the Inner Pause Pass gate Practice? Today all 5 paths are free; Pass copy only promises deeper Journey insight. (Option: first path or first 3 days free.)

## Next up (agreed plan)

1. ~~Phase 3~~ done (2026-11-23): Kinverse intro is an optional "How it works" sheet on Entry (not a gate, PRODUCT_FLOW §39.A) plus "I have an account"; dev-only test sign-in at `/local-test-sign-in`.
2. ~~Phase 4~~ done (2026-11-25): tap-to-expand view transitions (see "Motion notes" below).
3. **Phase 5 — cleanup:** delete 13 legacy `--ip-*` screens (chakra/healing/session/mvp/analysis/guidance/premium/progress/history/journal/player routes) and the old 7-skill Practice code (`practice-skill-*`, `practice-session-screen`, `practice-content/engine/entitlement/milestones/skills`, `/practice/[pathId]/session`). Check nothing references them; build.
4. **Phase 6 — backend (Yogesh's):** port Kinverse `/practices/push-subscriptions` + scheduled sender (web-push, VAPID); optional private journal sync; add backend tests; `@hono/node-server` 2.x upgrade (moderate advisory); remove dormant admin content endpoints.
5. **Phase 7 — final QA:** click through every flow in light + dark, `next build`, eslint, contrast, reduced motion, `npm run test:ui`.

## How to test (the user wants real click-through testing, not just screenshots)

- Dev server: `cd frontend && npx next dev --port 3100`. If `EADDRINUSE`, a stale Next node process holds 3100 — find it with PowerShell `Get-NetTCPConnection -LocalPort 3100` and stop it.
- Click harness: scratchpad `shots/shoot.mjs` (playwright-core + system Chrome `C:/Program Files/Google/Chrome/Application/chrome.exe`, `--autoplay-policy=no-user-gesture-required`, 390×844). Steps: `goto:/x`, `role:button|Name`, `role:tab|Name`, `clickSel:css`, `eval:js`, `wait:ms`, `shot:name`, `full:name`. Recreate it if the scratchpad was cleared.
- Entry gate: first visit `/entry` → click "Begin".
- Signed-in testing without real Mongo: in scratchpad `mongo/`, `npm i mongodb-memory-server@10` and run a script that does `MongoMemoryServer.create({ instance: { port: 27018 } })`. Start the backend with `MONGODB_URI=mongodb://127.0.0.1:27018/innerpause-test AUTH_SECRET=<anything> LOCAL_TEST_AUTH=true PORT=4000 npx tsx src/index.ts`, and the frontend with `API_URL=http://localhost:4000 NEXT_PUBLIC_LOCAL_TEST_AUTH=true npx next dev --port 3100`. Then `/local-test-sign-in` → "Enter as test listener". (Docker Desktop is installed but its daemon is usually off.)
- Unit tests: `npm test` at the root (node --test, in `frontend/tests` and `backend/tests`).
- Checks before each commit: `npx tsc --noEmit -p .` and `npx eslint <files>` in `frontend/`.

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
