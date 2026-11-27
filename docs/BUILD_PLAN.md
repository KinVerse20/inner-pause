# Build plan: everything open, 2026-11-26

**Status 2026-11-26: items 1 to 12 built** (one commit each on `feature/our-ui-unification`; see HANDOFF "Built 2026-11-26" for the calls made). Items 13 to 17 still need the founder.

For whoever builds next (Kinverse and his Claude Code). Branch: `feature/our-ui-unification`.
Every item below was diagnosed in the running app. Each says what's **decided** (build as written),
**proposed** (build as written unless the founder says otherwise), or **needs the founder** (ask first).

## Before you start

- Read `docs/HANDOFF.md` (decisions, test harness, gotchas) and `frontend/AGENTS.md`: this is Next 16 with breaking changes; read `node_modules/next/dist/docs/` before writing Next code.
- Look: our design wins (`docs/BRAND_IDENTITY.md`, `docs/DESIGN_SYSTEM.md`, `docs/FOUNDATION.md`). Copy follows DESIGN_SYSTEM §14: calm, plain, second person, **no dashes**. No explainer paragraphs, no jargon, nothing that feels like an "AI guide". Familiar app patterns.
- Chakras are *traditional inspiration*: show names and Hz, never claims ("healing your heart chakra").
- Do not merge `origin/feature/practice-guided-breathing-mindspace`; port from it only.
- Run: `npm install`, set `.env.local` (README), `npm run dev`. Test sign-in: `/local-test-sign-in`.
- Per item: one commit, `npx tsc --noEmit -p .` and `npx eslint <files>` in `frontend/`, `npm test` at the root, then click through it on a 390×844 phone viewport in **light and dark**. For anything with sound, measure what reaches the speakers (HANDOFF "How to test"), not "the audio element is playing".
- Show the founder screenshots of each item. They judge by using the app.

## Order

| Phase | Items | Why this order |
|---|---|---|
| 1. Quick fixes | 1 Scroll · 3 Trail names · 10 Rest 963 Hz | Small, unblock testing everything else |
| 2. Session core | 2 Sound while browsing · 6 Time listened · 8 Several frequencies | All three rewrite the same session code: do them together |
| 3. Practice | 4 Check-in (with 11) · 9 How this path is built | Uses the time tracking from phase 2 |
| 4. Moments | 5 One start choice | Uses the running session from phase 2 |
| 5. Speak | 7 Hindi in English letters | Independent |
| 6. QA | 12 Final QA | Last |
| Ask the founder | 13 to 16, then 17 before launch | Not to build without a yes |

---

## Phase 1

### 1. Scrolling is broken on every screen (decided)
Mouse wheel and trackpad don't scroll any page (19 of 25 routes are taller than the screen); touch is likely the same.
**Cause:** `frontend/app/globals.css` makes `body` its own scroll box that never overflows, and `overscroll-behavior-y: contain` stops the scroll passing to the page:
`html, body { overflow-x: hidden; overflow-y: auto }` (around line 1243) and `body { overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior-y: contain }` (around line 1038). From commit 57d0d39.
**Fix:** `html, body { max-width: 100%; overflow-x: clip }`; remove `overflow-y` and both overscroll/touch lines from `body`; add `html { overscroll-behavior-y: contain }` (keeps pull-to-refresh off).
**Done when:** wheel and Page Down reach the bottom on every route, nothing scrolls sideways, the tab bar stays pinned, changing tabs starts at the top. Already verified by injecting this CSS on all 25 routes.

### 3. Practice trail: day names cut off (decided)
13 day names across the 5 paths are cut ("Remember your…"); on a started path the "Today" tag overlaps "WEEK 1".
**File:** `frontend/components/path-trail.tsx` (names are `line-clamp-2 w-[5rem]`, `STEP = 88`).
**Fix:** wider spacing (`STEP` about 112), name box about `6.5rem`, up to 3 lines with no ellipsis, raise `HEIGHT` to fit; move the WEEK 1 / WEEK 2 labels below the trail.
**Done when:** a script finds no clipped name (`scrollHeight > clientHeight`) on any of the 5 paths, before and after starting a path; Today and week labels never touch.

### 10. Rest path to Crown 963 Hz (decided)
In `frontend/lib/programme-data.ts` the `sleep` path is `chakra: 'Third eye'`, `frequencyHz: 852`; change it to Crown and 963; check every place the Rest path shows its centre and Hz.

---

## Phase 2: the session core (build 2, 6 and 8 together)

### 2. Sound keeps playing while you move around the app (proposed)
Like Spotify. Today the `<audio>`, tone layer (`lib/use-tone-layer.ts`), tuned sound (`lib/use-tuned-sound.ts`) and clock all live inside `components/pause-player-screen.tsx` (about 1,050 lines), so leaving the screen stops everything.
**Build:**
- Move the running session (audio element, tone and tuned graphs, clock, fades, closing beat) into a provider mounted in `app/layout.tsx`. Replace the inert old `components/player-provider.tsx` (`pwa-registration` reads its `isPlaying`; keep that working).
- The player screen becomes a view of that session.
- Mini player above the tab bar while a Pause runs: name, time left, play/pause; tap to open the player.
- A minimise chevron at the top of the player. The X stays "End Pause".
- Media Session: name and play/pause on the lock screen and headphones.
- If the Pause ends while you're elsewhere: the sound fades as now, and the mini player becomes "Pause complete · Check in". Never navigate the person away.

**Done when:** start a Pause, switch through every tab, sound and clock carry on (measured), the mini player controls it, the check-in still runs, and a completed Pause still completes its Practice day or Moment.

### 6. Count the time actually listened (decided, rule proposed)
Today a Practice day completes whenever its Pause gets `completedAt` (check-in or Skip), even after 5 seconds (`completeDay` in `components/practice-path-screen.tsx`). Days advance by count (`currentProgrammeDay` in `lib/programme-storage.ts`), so all 14 can be done in one afternoon. Journey shows the *planned* `durationSeconds` (`components/journey-story.tsx`); the real time is never stored.
**Build:**
- Store listened seconds on the Pause record (`lib/pause-storage.ts`), counting only time actually playing.
- **Decided:** the next Practice day opens on the **next calendar day**: "Day 2 opens tomorrow. Carry today's task with you."
- **Proposed rule:** a day counts once listening **that calendar day adds up to half the session** (2.5 of 5 min, 5 of 10), across sittings. If stopped early, the path shows "Day 3 · 2 of 5 min · Pick up where you left off" and resumes there, not from 0.
- Journey shows real time listened, and the totals add it up.

### 8. A Pause with several frequencies, one after another (decided)
Sahil built this on his branch (`packages/shared/src/session-planning.ts`, `createSessionPlan`, tests in `backend/tests/session-planning.test.ts`): one block per chakra, played in sequence, root to crown. We lost it: Tell lets you pick up to 4 feelings (`MAX_TELL_EMOTIONS`), but `classifyTellInput` in `shared/src/tell.ts` keeps only the top category, so one frequency plays.
**Decided by the founder:**
- In sequence, never two tones at once.
- Up to **4 centres** (one per feeling, so nothing is dropped).
- **No length choice and nothing to fill.** The Pause keeps its length (Tell = 10 min, `RIGHT_NOW_DURATION_SECONDS` in `lib/pause-engine.ts`) split evenly: 1 = 10, 2 = 5 + 5, 3 ≈ 3:20 each, 4 = 2:30 each.
- A minimal version of Sahil's "journey", **visible without tapping, before and during**.

**Planner (shared):** each picked feeling's strongest category (`EMOTION_WEIGHTS`) gives its centre (the category's `chakraId`); group feelings by centre, order root to crown, split time evenly. Feelings that share a centre make one stop. Written text with no feelings picked keeps today's routing (one Pause, or the "A few Pauses could help" list). Port Sahil's tests, adjusted to these rules.
**Pause record:** add `blocks: { chakraId, hz, feelings, seconds }[]`; old records read as one block.
**"Your Pause" screen** replaces the confident view of `components/tell-recommended-screen.tsx`:
```
Your Pause · 10 min

 ● Root · 396 Hz            5 min
   Anxious · Restless
   Grounding, safety and belonging
 │
 ● Heart · 639 Hz           5 min
   Lonely
   Compassion, balance and connection

 Sound   Rain · Soft tone   ›

 [ Begin my Pause ]
```
Each stop: centre colour, name, Hz, minutes, the person's own feeling words, and one short line reusing `meaning` from `frontend/data/chakras.ts`. Tapping a stop opens the existing `/chakras/[id]` (optional). The Sound row opens the existing Sound sheet, pre-filled with the default sound. "Begin my Pause" is the only tap needed. One centre = one stop, same screen.
**Player:** a row of stop dots at the top (current one lit), "Heart · 639 Hz" and "for: Lonely" under the title, ring and glow in the centre's colour. At each change: soft haptic, colour drifts, about 3 s of "Moving to Heart · 639 Hz", the undertone crossfades over a few seconds, the chosen sound keeps playing. No explanations in the player.
**Sound detail:** several stops use the library or plain sound plus an undertone. The premixed "tuned" recordings and server-rendered uploads are single-frequency, so use them only for one-stop Pauses.
**Journey:** the Pause stamp shows a dot per centre ("Root → Heart").
**Done when:** picking Anxious + Lonely gives two stops; measured output shows 396 Hz then 639 Hz with rain throughout; 4 feelings on 4 centres give 2:30 each; one-feeling and text-only Pauses behave as today.

---

## Phase 3: Practice

### 4. Check-in before each Practice session (decided; extras proposed)
Today (`stage === "checkin"` in `components/practice-path-screen.tsx`): a "yesterday" text box (asked even on Day 1), the 1 to 5 "How strongly did it affect you?", and an exercise text box.
**Decided flow:**
1. **Before:** one screen, no typing needed:
   - "Last time you planned to: *{yesterday's action}*". Yes · Partly · Not yet. Skipped on Day 1.
   - How are you today: a few feeling chips.
   - "How strongly did it affect you?" 1 to 5, **stays as is**.
   - One optional "Add a note" link. The two big text boxes go.
2. The session.
3. **After:** today's task (the day's `action`) is given ("Carry this with you"). The next check-in quotes it back.

Today's exercise moves into the session as the gentle thought card (`ThoughtCard` in `components/breathing-guide.tsx`), so writing is optional. Extend `ProgrammeCheckIn` in `lib/programme-storage.ts` (task answer, feeling today); keep old records readable.

### 11. Practice usefulness (proposed; confirm with the founder)
Fold these into item 4:
- **Not yet:** keep the same task one more day, said kindly, instead of moving on as if it were done.
- **Trend:** show the 1 to 5 ratings over time ("Self-doubt: 4 → 2 this week").
- **Reminder:** the push quotes the task ("Did you get to: label one doubtful thought?"); `backend/src/reminders.ts`.
- **Kind catch-up** after missed days: "Pick up at Day 5?", with no broken-streak guilt.
- **Day 14 keepsake:** the tasks that worked best, saved to Journey.
- **Later:** a one-minute "use it now" tool.

### 9. "How this path is built" (decided)
On the path screen, in the app theme: the 14-day arc, how the sound grows with you, what you'll hear, and why this centre and Hz. Short, visual, no paragraphs. Files: `components/practice-path-screen.tsx`, `components/path-preview.tsx` (`DayAnatomy` there already shows what a day holds), `lib/programme-data.ts`.

---

## Phase 4: Moments

### 5. Speak, Write and "Just breathe" as one start (proposed)
Today, after picking a moment, the player waits on "Want to let it out first?" with Speak / Write and a small "Just breathe" link that doesn't read as starting anything (`components/let-it-out.tsx`). The start buttons are worded three ways: "Just start a Pause", "Just breathe", "Begin my Pause".
**Build:** the Pause starts at once (sound and clock running). The player shows a soft card "Want to let it out? Speak · Write". Ignore it and you're in your Pause. Speak or Write opens a panel over the running Pause; closing it saves the words to the Moment (as today) and leaves you in the Pause. Every start button in Moments says **Begin my Pause**. Nothing blocks the session.

---

## Phase 5: Speak

### 7. Hindi speech, written in English letters (decided; method proposed)
`frontend/lib/use-voice-transcription.ts:78` hard-codes `recognition.lang = "en-US"`, so Hindi gives nothing. Used by Moments let it out, Tell (`tell-compose-screen.tsx`) and the Return to Me banner.
**The founder wants Hindi shown in English letters**: "aap kya kar rahe ho", never Devanagari.
**Build:**
- A small English · Hindi toggle by the mic, remembered in preferences, defaulting from the device language. English uses `en-IN`.
- Hindi: recognise as `hi-IN` on the device, then transliterate to Roman letters on the device before showing it. Private (keeps Moments' "Nobody else will read this") and free.
- The hard part is the silent "a": it must give "kar", not "kara". Test on everyday phrases.
- Check mixed speech: "meeting" in Hindi mode comes back as मीटिंग.
- Only if quality isn't good enough, fall back to server speech-to-text asking for romanized Hinglish. It costs money and sends words off the phone, so ask the founder first.
- Tell's feeling matching (`EMOTION_WEIGHTS`) only knows English words; add common Hinglish ("ghabrahat", "tension ho rahi hai") so Tell routes well.

---

## Phase 6: Final QA (12)
- Rewrite `npm run test:ui` (`frontend/scripts/mobile-usability-test.mjs` still walks deleted routes).
- Click through every flow in light and dark, including sheets, check-ins, empty, error and 404 states.
- Run `next build` and eslint.
- Check contrast and reduced motion.

---

## Ask the founder before building
13. ~~**Should the Inner Pause Pass gate Practice?**~~ **Decided 27 Nov: yes, everything is behind the Pass except the trial of 2 Pauses.** Every Practice session plays through the player, so the trial gate covers it; Tell, journal writing and the Return to Me check in close too once the trial is used (see COMMERCIAL_PLAN C2).
14. **Raise the library recordings by about 8 dB?** They're quiet: RMS -24 to -32 dB.
15. **Safety card on writing screens** (Home Tell, Moments let it out, Journey journal): a calm helpline card (Tele-MANAS 14416) on crisis words. Parked by the founder. Letting it out now invites venting, and the only crisis check in the code is in the unused `/api/analyze`.
16. **Unused files kept for a decision:** `install-pwa-prompt`, `help-tooltip`, `chakra-inspiration-tag` + `lib/practice-paths.ts`, `chakra-visual/symbol/path-ui`, `lotus-visual`, `waveform-face`, `lib/providers/*`, `ai-schemas`, `insights`, `use-app-preferences`, `use-mvp-state`, `use-progress-store`, `POST /api/analyze`; `/auth/reset-password` is still the old gold design.

## Before public launch
17. Move the audio to object storage and a CDN (S3 or R2). There is one base URL in `frontend/lib/sound-library.ts`.
