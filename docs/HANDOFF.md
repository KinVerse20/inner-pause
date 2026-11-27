# Session handoff — Inner Pause UI unification

Last updated: 2026-11-27. Read this first in a new session, then continue from "Next up".

## Built 2026-11-27 (later): the founder's issues list

- Everything is behind the Pass except the 2-Pause trial (`appAccess()` in `frontend/lib/trial.ts`). Patterns and Growth are switched off for now (code kept in `lib/pattern-*.ts`, `lib/growth-model.ts`). Admins (ADMIN_EMAILS) read as a Pass for life. `/admin` opens any account to see and change it (logged in `admin_changes`).
- Sound: on top Rain, Rainforest, Ocean, Wind, Deep ambient, Binaural; under More: Mindspace, Bilateral calm, Piano tuned, Frequency only. Forest, Piano, Gong, Bell, Rain tuned and Forest tuned are gone; ids that name them play their replacement (`RETIRED` in `lib/sound-library.ts`). Their files are still in `public/audio` but nothing plays them.
- What the player says is what plays: a tuned recording only at exactly its frequency (otherwise Rain with the frequency beneath it); Deep ambient and Mindspace had a 174 Hz drone of their own, taken out of the files with a notch filter; Binaural is made live at the Pause's frequency (left ear) and 6 Hz above it (right). Frequency only and Binaural have Soft, Balanced and Clear.
- Guide tab (`/guide`, `components/guide-screen.tsx`): how Inner Pause helps and how to use each part, with Try it links. The bar is Home · Moments · (Pause) · Practice · Guide · You; the columns are weighted so Pause stays centred.
- `/welcome`: the Instagram landing page (`components/welcome-screen.tsx`), public, keeps the ad's utm_ tags into /install. Ads in `marketing/ads/` (2 concepts, feed and story sizes; `node marketing/ads/render.mjs`).
- Report a bug shows the user each report's status and the admin's note; turning one down needs a reason.
- Player: Skip frequency (to the next centre; on the last or only one it ends the Pause) and End session under Play; the thought card folds away instead of holding an empty gap. All DEV panels are gone.

## Built 2026-11-27: the commercial plan (docs/COMMERCIAL_PLAN.md C1 to C8, not C4)

No free version any more: a Pause needs an account, then a trial of 2 Pauses (each counted on the server when the listener confirms starting it, `startTrialPause` in `lib/trial.ts`, `POST /api/pass/trial`), then the Pass: ₹1,000 a year shown as ~~₹2,000~~ (`shared/src/brand.ts`). Ends soon emails 7 days and 1 day before (`backend/src/pass-reminders.ts`). `/install` for the ads (Android prompt, iPhone Share steps, utm_ tags saved at sign up). Report a bug (`/profile/report-bug`) and `/admin` (ADMIN_EMAILS only): Valid gives a month once. Razorpay is tested against a stand-in (`backend/tests/payments.integration.test.mjs`); real test keys, then live keys, are the founder's step (docs/LAUNCH.md step 3). Local runs: the API needs `ADMIN_EMAILS=test@innerpause.local` to try /admin with the test listener.

## Built 2026-11-26: the whole build plan (docs/BUILD_PLAN.md items 1 to 12)

All twelve buildable items are in, one commit each, checked at 390 × 844 in light and dark, sound measured at the speakers. Items 13 to 17 still need the founder. Calls made while building, for the founder to see:

- **Practice centres:** Uncertainty plays Root 396 Hz and Emotional Regulation Heart 639 Hz (their sound categories were swapped; the labels were right).
- **Several frequencies (item 8):** each feeling's centre comes from Sahil's emotion catalog (`shared/src/session-plan.ts` `FEELING_CENTRES`), not `EMOTION_WEIGHTS`, which put most feelings on Heart. So one feeling alone can now play a different centre than before (Anxiety alone: Reset, Root; it was Calm, Heart).
- **Item 11:** the founder picked Not yet keeps the task, the reminder quotes the task, kind catch up and the day 14 keepsake; not the rating trend.
- **Item 9:** a Practice day now plays the sound and tone its day gives (they were in the data but unused).
- **Item 7:** Hindi is done on the device (`frontend/lib/hinglish.ts`), no server fallback. Not yet tried on a real phone's Hindi recognizer.
- **Contrast (item 12):** muted text is `#57667B` (was `#64748B`, 4.45:1) and the dark accent is `#A594F9` with navy text on buttons (was `#7C6AED`, 3.9:1). BRAND_IDENTITY §4.2 updated.

Where the new pieces live: the running Pause `frontend/components/pause-session.tsx` (root provider) and `mini-player.tsx`; time listened and Practice day rules `frontend/lib/listening.ts`; tasks `frontend/lib/practice-tasks.ts`; Moments let it out `components/let-it-out.tsx`; the UI test `frontend/scripts/mobile-usability-test.mjs` (`npm run test:ui`, see README).

## Where things are

- Branch: `feature/our-ui-unification`, pushed to origin (KinVerse20/inner-pause) on 2026-11-25 (head `bb4e4e6`, README rewritten for the current stack). Base: `554815e` (Yogesh's latest on `feature/aws-full-stack-test`). No PR opened yet.
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

## Founder requests 2026-11-26 (all built 2026-11-26, see above; kept for the reasoning)

**Kinverse builds these.** Full ordered plan with done-when checks for everything open: [docs/BUILD_PLAN.md](BUILD_PLAN.md).

1. **Scroll broken on every screen (wheel/trackpad; likely touch too).** Cause: `globals.css` makes `body` its own scroller (`html,body{overflow-x:hidden;overflow-y:auto}` + `body{overflow-y:auto;overscroll-behavior-y:contain}`, from commit 57d0d39 "Fix mobile scrolling"). Body never overflows and `contain` stops the scroll chaining to the page. Fix, verified on all 25 routes by injecting it: `html,body{overflow-x:clip}`, drop body's `overflow-y`/`overscroll-behavior`, put `overscroll-behavior-y:contain` on `html`.
2. **Sound keeps playing while you browse (Spotify-style).** Today the audio, tone layer and clock live inside `pause-player-screen.tsx`, so leaving stops everything. Proposal: move the session into a root-level provider (replace the inert old `PlayerProvider`), mini player above the tab bar, minimise chevron in the player (X stays "End Pause"), Media Session for lock screen. If it ends while away: fade out, mini player shows "Pause complete · Check in".
3. **Practice trail day names cut off** (13 names across the 5 paths, e.g. "Remember your…"; "Today" tag collides with "WEEK 1"). `path-trail.tsx`: names are `line-clamp-2 w-[5rem]` at `STEP = 88`.
4. **Practice pre-session check-in redesign.** Replace the two text boxes with: quote last session's task ("Yesterday's task: …" Yes / Partly / Not yet) + how you feel today; keep "How strongly did it affect you?" 1 to 5. Then the session, and the task is given at the end; next time the check-in quotes it back. Day 1 has no previous task.
5. **Moments let it out: "Just breathe" doesn't read as starting the Pause.** Make Speak / Write / start one cohesive choice with no blocker before the session (`components/let-it-out.tsx`, mode page's "Just start a Pause").
6. **Session time isn't counted.** A Practice day completes whenever its Pause record gets `completedAt` (check-in or Skip), even after 5 seconds (`completeDay` in `practice-path-screen.tsx`); days advance by count, not by date. Journey shows the *planned* `durationSeconds`, never the time actually listened (the record doesn't store it).
   - **Decided:** the next Practice day opens on the **next calendar day** ("Day 2 opens tomorrow. Carry today's task with you.").
   - **Proposed, founder leaning yes:** a day counts once **listening that calendar day adds up to half the session** (2.5 of 5 min, 5 of 10), across sittings. Ending early shows "Day 3 · 2 of 5 min · Pick up where you left off" and resumes there (not from 0). Store actual listened seconds on the Pause record; Journey shows real time.

7. **Speak only understands English; Hindi gives nothing.** Cause: `lib/use-voice-transcription.ts:78` hard-codes `recognition.lang = "en-US"`. The browser's recognizer hears one language at a time and doesn't auto-detect. Affects every Speak: Moments let it out, Tell, Return to Me banner. **Founder wants Hindi speech written in English letters** ("aap kya kar rahe ho"), never Devanagari. Proposal: recognise as `hi-IN` on the device (gives "आप क्या कर रहे हो"), then transliterate to Roman on the device before showing it. Private (nothing leaves the phone, keeps Moments' "Nobody else will read this") and free. The hard part is schwa deletion ("kar", not "kara"): naive letter mapping is wrong, so test on everyday phrases. Mixed speech ("meeting" heard in Hindi mode comes back as मीटिंग → maybe "miting") needs checking. Fallback only if quality isn't good enough: server speech-to-text (OpenAI, key already in the backend) asked for romanized Hinglish, which costs money and sends the words off the phone. Needs a language toggle by the mic (English · Hindi), remembered, defaulting from the device language; English as `en-IN`. Also: Tell's feeling detection (`shared/src/tell.ts` EMOTION_WEIGHTS) only knows English words, so Hinglish in Tell ("ghabrahat", "tension ho rahi hai") won't route well yet; Moments let it out is fine (nothing is analysed).

8. **Two feelings on different frequencies should give a Pause with both (Kinverse/Sahil built this; we lost it).** Theirs: `packages/shared/src/session-planning.ts` on `origin/feature/practice-guided-breathing-mindspace`, `createSessionPlan` makes one block per chakra, played **in sequence** (root to crown), each 5/10/15 min by depth (their test: 5 feelings, 4 chakras = 396→417→639→852 Hz, one hour). Ours: Tell lets you pick up to `MAX_TELL_EMOTIONS`, but `classifyTellInput` (`shared/src/tell.ts`) keeps only the top category, so one frequency plays. Proposal: blocks in sequence (never two tones at once; they clash), **splitting** the Pause's length rather than adding to it (10 min, two frequencies = 5 + 5), max 3; the chosen sound keeps playing and only the undertone crossfades; the player shows "Now: Heart · 639 Hz · Next: Throat · 741 Hz" and which feeling each is for; Journey records every frequency used. Ties into item 2 (the session moving into a root provider) and item 6 (time listened).
   - **Founder (2026-11-26): one after another, confirmed. Wants Sahil's "journey" (which chakra each feeling is worked in, then customise sound) but very minimal.** Sahil had 3 screens before playing (results "Here's what may need attention" → setup "Shape your sound" → review "Your frequency journey"). **Plan:** one screen replacing `tell-recommended-screen.tsx`'s confident view: "Your Pause · 10 min", a small vertical trail (per stop: chakra colour, name, Hz, the user's feeling words, minutes; tap → existing `/chakras/[id]`), a Sound row opening the existing Sound sheet, Length 5 · 10 · 15, "Begin my Pause". One centre = one stop (same screen). Text with no feelings picked keeps today's routing. Player: "Root · 396 Hz" + "Next: Heart", ring in segments, undertone crossfades, chosen sound continues. Journey stamp shows a dot per centre. Engine: shared planner (group by chakra, root to crown, split time evenly, max 2 centres at 5 min, 3 otherwise, min 2 min each; port Sahil's tests); PauseRecord gets `blocks[]` (old records = one block); multi-block uses library/plain sound + undertone (premixed tuned files and rendered uploads are single-frequency). Moments/Practice stay single for now. Build after item 2 with item 6. **Decided (2026-11-26):** up to **4 centres** (one per feeling, `MAX_TELL_EMOTIONS` = 4, so nothing is dropped). **No length choice and nothing to fill:** the Pause keeps its length (Tell = 10 min, `RIGHT_NOW_DURATION_SECONDS`) split evenly (1 = 10, 2 = 5 + 5, 3 ≈ 3:20 each, 4 = 2:30 each); Sound row pre-filled with the default sound, so "Begin my Pause" is the only tap. Each stop shows **feeling words + one short line**, reusing `meaning` from `data/chakras.ts` (e.g. Heart: "Compassion, balance and connection"). This replaces the Length chips and the "min 2 min / max 2 at 5 min" rule above.
   - **Founder: showing the chakra and Hz builds meaning; it shouldn't need a tap.** Plan: visible before AND during, quiet. Before: the "Your Pause" trail is open (tap to the chakra page stays optional). During: a row of stop dots at the top (current lit), "Heart · 639 Hz" + "for: Lonely" under the title (the player already shows chakra · Hz for single Pauses), ring/glow in the centre's colour; at each change a soft haptic, colour drift, and ~3 s "Moving to Heart · 639 Hz". No explanations in the player (player stays quiet). After: Journey stamp shows the dots ("Root → Heart"). FOUNDATION: chakras as traditional inspiration, never claims like "healing your heart chakra".

**Founder's call (2026-11-26): note all eight, build none yet.** Proposals and extra Practice ideas (keep "Not yet" task one more day, rating trend, reminder quoting the task, kind catch-up, day-14 keepsake) are in the chat of that date; summarised above.

## Next up (in this order)

A. ~~**Moments home tiles redesign**~~ Done 2026-11-25: mode tiles built like Home's (outcome-tile wash, `TileMotif` moment motifs, new `components/moment-emblem.tsx`, everyday examples), Explore as a card, landscape bands removed from the mode page and Explore. Also fixed: picking a sound with Ambient sound off now turns it on (it used to stay silent), a sound routed mid-fade no longer sticks near silence (`lib/use-tuned-sound.ts`), and the player's gentle thoughts have their own card below the controls (`ThoughtCard`), apart from the guide. Open: the library recordings are quiet (RMS -24 to -32 dB); raising them ~8 dB was offered, not approved.
B. **Practice "How this path is built"** (approved): in the app theme, on the path screen: the 14-day arc, how the sound grows with you, what you'll hear, why this centre and Hz. Also switch the **Rest path to Crown 963 Hz** (approved). Files: `components/practice-path-screen.tsx`, `lib/programme-data.ts`, `components/path-preview.tsx`.
C. **Practice usefulness** (proposed, founder hasn't picked yet): 1 close the loop on yesterday's action (Yes / Partly / Not yet), 2 trend of the daily 1 to 5 ratings, 3 day-14 toolkit keepsake, 4 kinder catch-up ("Pick up at day 5?"), 5 "use it now" 1-minute tool. Recommended 1, 2, 4.
D. Phase 7 final QA (below).

Sound note for the founder's question: library sounds (Rain, Forest…) play the plain recording with the Pause's frequency as a soft **undertone** underneath (Tone: Off · Soft · … in the Sound sheet). So Rain sounds a little different per Pause because each Pause has its own Hz; Tone Off gives plain rain. The "tuned" sounds under More are recordings made at the frequency (no undertone).

### Earlier phases

1. ~~Phase 3~~ done (2026-11-23): Kinverse intro is an optional "How it works" sheet on Entry (not a gate, PRODUCT_FLOW §39.A) plus "I have an account"; dev-only test sign-in at `/local-test-sign-in`.
2. ~~Phase 4~~ done (2026-11-25): tap-to-expand view transitions (see "Motion notes" below).
3. ~~Phase 5~~ done (2026-11-25): 14 legacy routes + screens and the old 7-skill Practice modules deleted (45 files). Journey highlights / Growth now read the 5 paths; Data & Privacy still exports/deletes old skill records by key; `/about` rebuilt in our design. **Left for a decision** (unreferenced, kept on purpose): `install-pwa-prompt`, `help-tooltip`, `chakra-inspiration-tag` + `lib/practice-paths.ts` (FOUNDATION chakra tag), `chakra-visual/symbol/path-ui`, `lotus-visual`, `waveform-face`, `lib/providers/*`, `ai-schemas`, `insights`, `use-app-preferences`, `use-mvp-state`, `use-progress-store`. Also: the old global `PlayerProvider` is still in `app/layout.tsx` but inert (only the deleted screens started it; `pwa-registration` reads its isPlaying); `/auth/reset-password` is still the old gold design.
4. ~~Phase 6~~ done (2026-11-25), on Yogesh's backend: `@hono/node-server` 2.1.11 (audit clean); admin endpoints + role retired (public content/sound reads and the render worker kept); app built by `createApp()` (`src/app.ts`) so tests call it in-process; **Practice reminders by web push** (`routes/practice.ts`, `push-store.ts`, `push-scheduler.ts`, `reminders.ts`; client `lib/programme-notifications.ts`), off until `VAPID_*` set; **optional private journal backup** (`routes/journal.ts`, `journal-store.ts` AES-256-GCM; client `lib/journal-sync.ts`, Data & Privacy toggle), off until `JOURNAL_ENCRYPTION_KEY` set. Not done here: `POST /api/analyze` is now uncalled (Yogesh's AI analysis; the screens that used it were deleted), kept for a decision.
5. **Phase 7 — final QA:** rewrite `npm run test:ui` (scripts/mobile-usability-test.mjs still walks the deleted prototype flow: /onboarding → /journal → /analysis …); click through every flow in light + dark, `next build`, eslint, contrast, reduced motion, `npm run test:ui`.

## How to test (the user wants real click-through testing, not just screenshots)

- **Testing sound:** "the audio element is playing" proves nothing. Measure what reaches the speakers: an init script patches `AudioNode.prototype.connect` so anything connected to `ctx.destination` also feeds an `AnalyserNode`, then read RMS per context (sound graph vs tone graph). Headless Chrome ignores autoplay rules by default; pass `--autoplay-policy=document-user-activation-required` to test like a real browser. Also check Settings → Sound → Ambient sound: off means tone only.

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
