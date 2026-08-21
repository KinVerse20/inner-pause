# INNER PAUSE — TECHNICAL ARCHITECTURE v1.0

> Source of truth for product behaviour: `docs/PRODUCT_FLOW.md`. This document defines the technical architecture required to build it. The existing codebase is evidence of what's already been built, not a constraint on what the target should be — existing screens and routes do not dictate this design.
>
> Planning only. Nothing in this document has been implemented.

---

## 1. Current Architecture

**Stack**: Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind 4. Dependencies are deliberately minimal — `@supabase/ssr` + `@supabase/supabase-js` for auth, `zod` for schema validation. No state management library, no animation library, no charting library, no payment library, no analytics.

**Routing**: File-based under `app/`. Auth-gated by `proxy.ts` (Next middleware) checking Supabase session cookies against an allowlist of public routes.

**State/persistence — two independent local stores, not unified**:
- `lib/mvp-storage.ts` — the "current" MVP data (profile, journal entries, analyses, plans, feedback), keyed `chakra-healing-mvp:{userId}` in `localStorage`, read via `useSyncExternalStore`.
- `lib/storage.ts` + `lib/progress.ts` — a separate structured-practice progress store (`chakra-journey-progress` key), tracking completion by `chakraId:sessionId`, with its own streak/badge/history logic.

These have never been merged. `lib/insights.ts` exists specifically to reconcile the two into one combined activity timeline for display purposes, which is a workaround, not a fix.

**Audio — two independent playback engines, not unified**:
- `PlayerProvider` (`components/player-provider.tsx`) — a global React context wrapping one `<audio>` element, with a persistent MiniPlayer that survives navigation. Powers the legacy quick-player and the Practice tab's structured session player.
- `healing-audio-player-screen.tsx` — its own local `<audio>` element, with no global context and no MiniPlayer. Powers the Pause-tab quick-pause and journal-driven reset flow. Playback state is lost on navigation away from this screen.

**Practice/progress engine** (`lib/progress.ts`, `data/chakras.ts`): 7 chakras × 5 fixed sessions each, unlock/streak/badge logic keyed by `chakraId:sessionId`. Structurally sound and reusable — this is the one subsystem that's already close to what a "Practice" engine needs.

**Journey/journal**: `mvp-journey-screen.tsx` combines the old separate History and Insights screens behind a segmented control (Overview/Journal). Insights (weekly bars, trends, time-of-day) are computed client-side from combined local data, not persisted.

**Notifications**: not implemented. `components/reminders-screen.tsx` stores label/time/day preferences in `localStorage` only — no `Notification` API call anywhere in the codebase.

**Authentication**: real, working — Supabase email/password via `@supabase/ssr`, session sync in `components/auth-session-sync.tsx`, middleware-enforced.

**Supabase / backend**: auth is live. A full relational schema already exists (`supabase/migrations/202608020001_chakra_healing_mvp.sql`) — `profiles`, `journal_entries`, `emotional_analyses`, `healing_sessions`, `session_feedback`, `user_patterns`, `morning_guidance`, `audio_tracks`, `subscriptions` — all RLS-protected, all with `on delete cascade` to `auth.users`. **Only `profiles` is actually written to.** Every other table, including `user_patterns` (Patterns) and `subscriptions` (Pass/payments), is fully defined and unused. This is the single most important finding in this audit — see §3.

**Dead code**: `lib/providers/*` — an `AuthProvider`/`DatabaseProvider`/`StorageProvider`/`JobProvider` abstraction meant to swap Supabase/AWS backends. Zero callers, stub implementations that throw.

**PWA / offline**: `public/sw.js` is a genuinely working service worker — app-shell caching, a separate asset cache, and a dedicated audio cache **with HTTP Range-request support** for seekable offline audio playback. This already works today and is a real asset.

**Payments**: no code exists anywhere (confirmed by search). No gateway, no UPI handling, no entitlement checks.

**Integrations**: OpenAI (via `app/api/analyze/route.ts`, with a deterministic-fallback path when no API key is set) for journal analysis. No Google Calendar integration. No voice transcription.

**Two coexisting product generations, both partially built, neither matching `PRODUCT_FLOW.md`**: a legacy dark-themed app (`/chakras`, `/journey`, `/progress`, still live, unreachable from current nav) and a light-themed "Design 6" rebuild (`docs/PRODUCT_ROADMAP.md`, Phases 1–4 of 6 complete). **Critically: `docs/PRODUCT_FLOW.md`'s actual product shape — Right Now/Big Moments split, Tell Inner Pause, Return to Me, Gift a Pause, Calendar, Inner Pause Pass, the 5-category notification model — is not implemented in code at all.** It exists only as documentation. The gap between "current code" and "current canonical product doc" is larger than the gap between the two previous code generations.

---

## 2. Target Architecture

- **One local-first data layer**, not two. A single local store (IndexedDB, not `localStorage` — see §12) covering Pause history, Practice progress, Journal/Reflections, preferences, and saved Pauses, with a sync layer to the *already-existing* Supabase schema for authenticated users.
- **One audio engine**, not two. A single playback service (context + hook) that every Pause-playing surface uses — Right Now, Big Moments, Practice — backed by the existing (good) service-worker audio cache.
- **A deterministic rules layer** (`lib/rules/`) as a first-class module, not scattered `if` statements — because `PRODUCT_FLOW.md` repeatedly requires specific behaviour to be rule-based, testable, and explicitly *not* AI, this needs to be a real seam in the codebase, not a convention.
- **A thin AI boundary**: one or two narrow AI call sites (free-text/voice interpretation, pattern/insight generation), never used for routing, timing, or scheduling.
- **The existing Supabase schema activated**, not replaced. `journal_entries` → Journal, `emotional_analyses` → analysis, `healing_sessions` → Pause instances, `user_patterns` → Patterns, `subscriptions` → Inner Pause Pass. This is mostly a wiring problem, not a schema-design problem.
- **New, currently nonexistent surfaces**: Big Moments (full BEFORE/DURING/AFTER lifecycle), Tell Inner Pause (a single reusable natural-language entry point), Return to Me, Gift a Pause (a small public-facing slice), Calendar integration (a real OAuth backend piece, v1 scope — §14), real push Notifications (v1 scope, built local-first then exercised in staging — §13), Payments (UPI+QR and/or a gateway, whichever proves simple — §15).
- **Three environments** (Local/Staging/Production, §12.1), with local development requiring no Supabase connectivity at all — a change in how the product is built, not just what it contains.
- **The legacy dark app** (`/chakras`, `/journey`, `/progress`, `app-shell.tsx`, `bottom-nav.tsx`) is deleted, not migrated — nothing in it is closer to `PRODUCT_FLOW.md` than the current build, and it's already unreachable.

---

## 3. RETAIN / REFACTOR / REBUILD / DEFER

| Subsystem | Classification | Why |
|---|---|---|
| Supabase auth (`lib/supabase/*`, `proxy.ts`) | **RETAIN** | Works; the account model is now mandatory-but-lightweight signup at Entry (`PRODUCT_FLOW.md` §39.A), not optional post-value signup — `proxy.ts`'s route protection needs to match that (§12.6). |
| Supabase schema (`supabase/migrations/*`) | **RETAIN, then activate** | Already models Journal/Pause/Patterns/Subscriptions closely. The gap is that it's unused, not that it's wrong. |
| `lib/progress.ts` + `data/chakras.ts` (chakra session engine) | **RETAIN, relabel — for the Core Practice Arc only** | Structurally sound 7-skill milestone engine, genuinely reusable once checkpoint content and skill labels align with `PRODUCT_FLOW.md` §17–§20 — but only as the authored Core Arc half of Practice (§6). Its hardcoded 5-sessions-and-done assumption is temporary legacy structure; it has no model for Ongoing Practice, which is net-new. |
| Service worker (`public/sw.js`) | **RETAIN** | Already does the hard part (Range-request audio caching) correctly. Needs a cache-eviction policy added (§19), not a rewrite. |
| Design tokens, `GlassCard`/`GoldButton`/`MvpShell` (`app/globals.css`, `components/mvp-shell.tsx`) | **RETAIN** | Light/dark theme system and shared primitives are sound and product-agnostic — reusable regardless of IA changes. |
| `WaveformFace` (`components/waveform-face.tsx`) | **RETAIN** | Lightweight, on-brand, matches §8/§9's "visually quiet" player requirement. |
| Two local-storage stores (`lib/mvp-storage.ts`, `lib/storage.ts`) | **REFACTOR → merge** | Not wrong individually, but the split itself is the problem (§12). Merge into one local data layer. |
| Two audio engines (`PlayerProvider`, `healing-audio-player-screen.tsx`'s local `<audio>`) | **REFACTOR → unify** | Both work; having two is the defect. One becomes the shared engine, the other's UI is ported onto it. |
| Current Home / category-tile IA (`mvp-home-screen.tsx`, `lib/pause-categories.ts`) | **REFACTOR** | The 5-tile model is ~70% of Right Now already (six outcomes, one-tap, no context step) — extend to 6 outcomes. **Not** "layer Big Moments alongside it": under the locked Home spec (`PRODUCT_FLOW.md` §5), Big Moments never appears alongside Right Now on Home — Home carries only Right Now, the Tell Inner Pause hero, and a compact Moments doorway that routes to a separate Moments screen. |
| Journey tab (`mvp-journey-screen.tsx`, `lib/insights.ts`) | **REFACTOR** | Overview/Journal split already maps reasonably onto Patterns+Growth / Highlights+Journal — needs restructuring into four named sections and real persistence (`user_patterns`), not a rewrite. |
| Onboarding, Settings, Profile screens | **RETAIN** | Not addressed by `PRODUCT_FLOW.md` in any conflicting way; keep as-is. |
| `lib/providers/*` (dead abstraction) | **REBUILD → delete** | Zero callers, throws on every method. Deleting it is a cleanup, not a loss. |
| Legacy dark app (`app-shell.tsx`, `bottom-nav.tsx`, `/chakras`, `/journey`, `/progress`, `home-screen.tsx`, `chakras-screen.tsx`, `journey-screen.tsx`, `progress-screen.tsx`) | **REBUILD → delete** | Unreachable from current nav, superseded twice over. Nothing here is closer to `PRODUCT_FLOW.md` than the current build. |
| Big Moments, Tell Inner Pause, Return to Me, Notifications, Gift a Pause, Calendar, Payments | **REBUILD (net-new)** | None of this exists in any form. Build fresh against the target architecture below, not against any existing screen. |

---

## 4. Domain Model

Minimal entity set — several requested concepts are modeled as *roles* on an existing entity rather than new tables, noted explicitly below.

| Entity | Definition | Key relations | Maps to existing schema |
|---|---|---|---|
| **User** | An account. | 1—many everything below. | `auth.users` + `profiles` (RETAIN) |
| **Pause** | One instance of a sound experience — the unit `PauseType` + duration + optional feedback produce. | belongs to User; optionally belongs to a BigMoment or PracticeSession | `healing_sessions` (RETAIN, generalize beyond "healing") |
| **PauseType** | Not a table — a fixed enum: `right-now` \| `big-moment-before` \| `big-moment-during` \| `big-moment-after` \| `practice` \| `center-pause`. Drives the hardcoded duration defaults (§7) and Arrive behaviour. `center-pause` is the locked center-nav action's Pause type (`PRODUCT_FLOW.md` §4/§7, the "Ground Pause") — a distinct type, not a reuse of `right-now` or any specific outcome. | — | new (enum only) |
| **BigMoment** | A named meaningful event (e.g. "Interview"), optionally calendar-linked, hosting Before/During/After Pauses. | has many Pause; has one MomentState; optionally sourced from a CalendarEvent | new |
| **MomentState** | Not a table — a status field on BigMoment: `upcoming → before-done → during-done → after-done → awaiting-return → resolved`. Drives Return to Me eligibility. | — | new (enum only) |
| **Practice** | A user's enrollment in one of the 7 skills — ongoing, not a fixed-length course (§18). | has many PracticeSession; has many PracticeCheckIn | new (thin wrapper over the existing chakra-progress data) |
| **PracticeSession** | One Arrive→Tell→Pause→Practice→Return instance within a Practice. | belongs to Practice; produces one Pause and one Reflection | `healing_sessions` + session index (RETAIN existing engine's session concept) |
| **PracticeMilestone** | Not a separate table — the session-count marker (1/5/10/15…) that triggers a PracticeCheckIn. Computed from session count, not stored. | — | derived |
| **PracticeCheckIn** | The lightweight prompt/response recorded at a milestone (§20). | belongs to Practice | new (small table) |
| **JournalEntry** | The base unit of all expressive user input — raw text, voice transcription, or both. Every "Reflection," Tell response, Practice Return, and meaningful feedback is a JournalEntry with a `source` discriminator. | belongs to User; optionally references a Pause, BigMoment, or PracticeSession | `journal_entries` (RETAIN) |
| **Reflection** | Not a separate table — a *role*: a JournalEntry whose `source` is `tell-response \| return-response \| practice-tell \| post-pause-feedback`. Modeled this way specifically to satisfy §23's "Journal is the view, not a separate store." | — | `journal_entries` with a `source` column |
| **JourneyHighlight** | A JournalEntry/BigMoment combination promoted to "something that happened in the user's life" (§22, §37). Not every Pause or Practice session becomes one. | references BigMoment and/or JournalEntry | new, thin (mostly a promotion flag + display metadata) |
| **Pattern** | An observation across history (§24), user-correctable. | belongs to User | `user_patterns` (RETAIN, exact match) |
| **GrowthRecord** | Primarily **computed, not stored** — derived from JournalEntry/Pause history on read (§25's mood-shift/frequency examples are aggregations, not facts to persist). Cache only if computation cost demands it later. | derived | none required initially |
| **Notification** | A scheduled/sent notification record — category, trigger reason, payload, delivery status. Needed even for local-only scheduling, as bookkeeping to prevent duplicate/repeat sends. | belongs to User | new (small table or local-only) |
| **CalendarEvent / CalendarContext** | A minimal cached projection of relevant upcoming events (title, time, classification result) — never the user's full calendar. | belongs to User | new, server-side only |
| **InnerPausePass** | The 60-day paid entitlement. | belongs to User | `subscriptions` (RETAIN, near-exact match) |
| **SavedPause** | A user-bookmarked Pause definition (not a played instance). | belongs to User | new (small table) |
| **GiftedPause** | A Pause + optional message + unguessable share token, resolvable without login. | references a Pause definition; not tied to a recipient User | new |
| **UserPreferences** | Theme, sound, practice, notification/calendar opt-in flags. | extends Profile | `profiles` (RETAIN, extend columns) |
| **Consent/privacy state** | Not a separate table — boolean/timestamp columns on Profile: `pattern_analysis_consent`, `calendar_consent`, `notification_consent`. | — | `profiles` (extend) |

---

## 5. Pause Engine

A single `lib/pause-engine.ts`, replacing both current audio code paths:

1. **Compose**: given a `PauseType` + context (outcome id, BigMoment id, PracticeSession id, or nothing for `center-pause`), resolve a `PauseDefinition` — sound environment, frequency/chakra layer, duration (hardcoded default per §7), Arrive requirement, and **two distinct guidance fields**: `arrivalGuidance` (shown only on Arrive / the Ground Pause's "Get comfortable" transition, never during playback) and `playbackGuidance` (a sparse, pre-authored, deterministic sequence shown during playback — `PRODUCT_FLOW.md` §7 — never the same content as `arrivalGuidance`, never a single field reused across both states). For `center-pause`, compose always resolves to the same fixed grounding/settling composition (the "Ground Pause," `PRODUCT_FLOW.md` §7, ~3 minutes) — no outcome input, no context input, always the same definition, including its own distinct `arrivalGuidance`/`playbackGuidance` pair.
2. **Arrive**: a short transition state, shown/skipped per the `PauseType`'s rule (§7) — not its own route, a state within the player. Ends via an explicit "I'm ready" confirmation (advances immediately) or auto-advance once its window elapses (no interaction ever required) — never a silent countdown-only state. `center-pause` always skips it, replaced by its own brief, fixed "Get comfortable" transition (not a duration-scaled Arrive, not itself a route or screen, and with no "I'm ready" step — it always auto-advances to playback).
3. **Play**: one shared playback hook (`usePauseEngine`), one `<audio>` element, used everywhere a Pause plays. Replaces `PlayerProvider` and `healing-audio-player-screen.tsx`'s local audio with one implementation; the MiniPlayer pattern from `PlayerProvider` is worth keeping since PRODUCT_FLOW.md doesn't forbid backgrounded playback.
4. **Feedback**: Better/Same/Not-better (§10), including the repeated-Not-better escalation rule — implemented in the deterministic rules layer (§8), not ad hoc per screen.
5. **Completion**: writes one `Pause` record (+ `healing_sessions` row when synced), optionally a `Reflection`/`JournalEntry`, optionally promotes to a `JourneyHighlight` per the Practice↔Journey boundary (§37).

## 6. Practice Engine

**Content model (`PRODUCT_FLOW.md` §18, locked): Core Practice Arc → milestone/check-in → Ongoing Practice.** The domain model must represent both halves, not just the first:
- **Core Practice Arc**: a finite, authored `PracticeSession` sequence per skill — this is what the existing `lib/progress.ts` engine already models (a fixed session list per chakra/skill). Its session-count-per-skill is a content-authoring decision (`PRODUCT_FLOW.md` §18), not fixed here.
- **Ongoing Practice**: begins once a skill's Core Arc is complete. Represented as a distinct mode/flag on `Practice` (§4), not a continuation of the same finite session list — it draws from a smaller, reusable set of variation/rep/exercise content plus continued check-ins/adaptation, rather than requiring an ever-growing authored session list. This is new — the existing engine has no equivalent today.

**On the existing `lib/progress.ts` engine**: its session unlock/streak/badge logic and session-count tracking are genuinely reusable for the Core Practice Arc specifically, and can be built on **for that purpose**. Its current hardcoded assumption of exactly 5 fixed sessions per skill, with nothing beyond session 5, is **temporary legacy structure to migrate away from**, not an architecture to retain "as-is" long-term — it has no representation of Ongoing Practice at all. Treat it as a starting point for the Core Arc half of the model, not the whole Practice engine.

- Checkpoint triggering (session 1/5/10/15…) becomes a pure function over session count — already close to how `lib/progress.ts` tracks completion, just needs a `getCheckpointTier(sessionCount)` function and the checkpoint content table from §20. The same function also determines the Core Arc → Ongoing Practice transition point (`PRODUCT_FLOW.md` §20) once a skill's authored content is exhausted.
- "For You" vs "Explore" (§17) is a thin recommendation layer over existing Practice enrollment + Pattern data — rule-based (§8), not AI, since it's a predictable recommendation.
- Adaptation (§19: "I only have 3 minutes" → shorter version) is interpreted via the AI boundary's free-text understanding (§9), then mapped onto deterministic session variants — AI interprets intent, rules choose the outcome. In Ongoing Practice, "session variant" specifically means a variation/rep/exercise from the reusable set above, not a new authored session.
- **Free/Pass boundary (`PRODUCT_FLOW.md` §36, locked)**: free is exactly two completed `PracticeSession` rows total, attached to whichever skill the user's first enrollment chose — never per-skill, never per-week. An entitlement check (`hasActivePass`, §15) gates starting a third session, or enrolling in a second skill, the same pattern as Journey's scope/depth gate (§7) — never a separate paid-only table, and never a restriction on reading the two free sessions' own history afterward.

## 7. Journey Architecture

Journal is the *view*; JourneyHighlight/Pattern/Growth are *interpretations* over the same underlying JournalEntry/Pause data (§37):
- **Journal** — a query, not a store: all JournalEntry rows for the user, chronological.
- **Highlights** — JourneyHighlight rows, each referencing the JournalEntry/BigMoment that produced them.
- **Patterns** — `user_patterns` rows, generated by the AI boundary's pattern-detection call (§9), always shown with the Relevant/Not really/Tell Inner Pause more correction UI (§24) — corrections feed back as training signal for future generation, not silently discarded.
- **Growth** — computed on read from JournalEntry/Pause history (mood-before/after, frequency), not a separately maintained ledger.

**Free/paid boundary (`PRODUCT_FLOW.md` §36, locked)**: Journal and Highlights are never gated — every `JournalEntry`/`JourneyHighlight` row is always fully readable regardless of Pass status; there is no query-level restriction on history itself. The boundary is entirely on *analysis depth*, applied at the pattern/growth generation and read layer, not by hiding underlying data:
- **Free**: pattern generation scoped to a bounded recent window (the "basic recent patterns" tier, §24) and a single-period Growth read.
- **Pass**: pattern generation scoped to full history ("longitudinal"), plus the comparative Growth read (§25's "then vs. now").
This is an entitlement check (`hasActivePass`, §15) gating the *scope/depth parameter* passed into the existing Patterns/Growth generation and read functions — never a separate paid-only table, and never a restriction on `JournalEntry`/`JourneyHighlight` access itself.

## 8. Deterministic Rules Engine

A single `lib/rules/` module, covering every case `PRODUCT_FLOW.md` explicitly requires to be hardcoded:

| Rule | Input → Output | Source |
|---|---|---|
| Context-step eligibility | entry point → show chips? (never for direct tiles, optional for Tell Inner Pause) | §6 |
| Pause duration defaults | PauseType → minutes | §7 |
| Playback guidance cadence | Pause duration/type → which pre-authored guidance lines, how many, and roughly when they appear during playback | §7 |
| Tell interpretation state | interpretation confidence → Clear / Ambiguous / Unclear state (never chosen by the AI call itself) | §16 |
| Check-in timing | session count → checkpoint tier or none | §20 |
| Notification selection | category + trigger condition → which prewritten message | §31 |
| Notification tap destination | category → route | §31 |
| Return to Me eligibility | MomentState + elapsed time → trigger or not. Locked timing: calendar-linked BigMoment → trigger shortly after the event's known end time; manually created BigMoment → trigger the following day, at an appropriate time. Exactly one follow-up per Moment; no further trigger once sent or once ignored past its window — `MomentState` moves to `resolved` either way, and the Moment's own record is never deleted, only its active surfacing stops. | §15 |
| Calendar → Big Moment mapping | event title keywords → BigMoment type or none | §32 |
| Pause → Practice recommendation | Pause outcome → recommend or not | §10, §39.B |
| Not-better escalation | attempt count → retry offer or shift-to-expression | §10 |
| Pass-offer trigger | gate hit or checkpoint reached → show offer | §36 |

All pure functions: `(input) → output`, unit-testable in isolation (§21), no network or AI call inside any of them.

## 9. AI Boundary

Exactly two call sites, both already partially precedented by the existing `/api/analyze` route:

1. **Text/voice understanding** — Tell Inner Pause free-form input → routes to a Pause or Practice action. Same shape as the existing `emotional_analyses` generation, extended to also emit a routing suggestion. Output resolves to one of the three product states in `PRODUCT_FLOW.md` §16 (Clear/Ambiguous/Unclear) via the deterministic confidence-tiering rule (§8), never a fourth AI-only state. When AI access is unavailable (no `OPENAI_API_KEY`, a local-development condition), a deterministic fallback resolves the same three states from the same input — the product UX must not differ based on whether the AI call actually ran; this is an implementation/environment detail, never a different intended experience.
2. **Pattern/insight generation** — periodic (not per-session) batch analysis of recent JournalEntry rows → candidate `user_patterns` rows and Growth summaries, always shown as correctable, never overwriting the user's own words (§26).

Everything in §8's table is explicitly **not** AI, including recommendation logic that could plausibly be framed as "smart" — "For You" Practice suggestions, Pause-to-Practice recommendations, and notification selection are all rule-based per §38. This keeps AI usage bounded to two request shapes, both already have a working example in the current `/api/analyze` route to extend from.

## 10. Audio Architecture

- **Composition**: `PauseDefinition` (§5) = sound environment + frequency/tonal layer + chakra/traditional tag, resolved from a static local catalog (extend `data/chakras.ts`'s shape) — **not** the unused `audio_tracks` Supabase table, initially. Content changes rarely enough that a remote catalog is unjustified complexity for v1; `audio_tracks` (with its `is_premium` flag) becomes relevant only if/when Pause content needs to vary without a redeploy, or paid-only sound packs are introduced — defer, don't build now.
- **Playback state**: one `usePauseEngine` hook (§5), one `<audio>` element app-wide.
- **Asset management**: existing `/public/audio/*.mp3` files, served through the existing service-worker audio cache (RETAIN).
- **Saved/downloaded Pauses**: `SavedPause` (§4) references a `PauseDefinition`, not raw audio; "downloaded" means present in the SW's `AUDIO_CACHE` — check cache membership, don't duplicate storage.
- **Offline**: already works for playback (§1). See §17 for the rest.

## 11. Voice → Journal

Voice input → transcription → **editable text shown to the user before saving** → JournalEntry. The edit step matters: it's the natural place to catch transcription errors and is implied by treating the *text* as the record, not the audio.

- **Transcription**: **confirmed — remote transcription initially**, not on-device. **Provider TBD — select the simplest reliable speech-to-text solution during implementation**, evaluated on accuracy, mobile/PWA reliability, latency, cost, privacy, and language support. Sits behind a narrow server-side interface (a single API route) specifically so the provider can change without touching client code, and so local development can stub it (§12.2) without needing live credentials. Audio is uploaded only as far as that transcription call requires and is never persisted server-side beyond the request (§18).
- **Fallback if transcription fails or is unavailable**: fall back to plain text entry (Write), not a blocked dead end — Speak is an accelerator for Write, never a hard requirement. This matters more with a remote dependency than it would on-device: a network failure or provider outage must degrade to "type it instead," never to a dead end.
- **Retention**: with remote transcription, the audio is necessarily sent to the transcription endpoint — but it is **not retained** beyond that request on the server (passed straight through to the transcription provider, never written to Supabase storage or any table), and the client-side `Blob` is discarded immediately once transcription resolves or fails (explicit `URL.revokeObjectURL` / drop the reference). "Not retained by default" means not persisted anywhere past the single transcription call, not that it never leaves the device.

## 12. Development Environments, Data Architecture & Authentication

Confirmed direction: local development must never require Supabase connectivity. Supabase is a staging/production concern, not a local dependency. This section defines the three environments, the sync boundary per entity, and when authentication actually becomes necessary.

### 12.1 Development Environments

**LOCAL**
- No Supabase connectivity required to develop, run, or test day to day. The full product — Pause, Practice, Journey — works against local data alone.
- Persistence: IndexedDB only (§12.4).
- Mocked/local equivalents, so no external dependency blocks local iteration:
  - **Calendar** — a local fixture list of sample events, not live Google OAuth.
  - **Payments** — a local entitlement toggle (flip `hasActivePass` in dev tools/local state), not a real UPI or gateway flow.
  - **Push notifications** — local `Notification` API calls only; the deterministic trigger logic (§8, §13) and UI are fully testable without a real push subscription.
  - **Voice transcription** — behind an interface (§11) that can point at the real remote endpoint or a stubbed fixed response, developer's choice; either way it's a mockable seam, not a hard local dependency.
- A developer *may* opt into a personal Supabase project or the local Supabase CLI to test sync behaviour, but this is opt-in, never required to start working.

**STAGING**
- A real, separate Supabase project — real auth, real data sync, exercised end-to-end for the first time in the pipeline.
- Where external/friend testers use real accounts.
- Integrations run in test/sandbox mode wherever the provider supports it: payment gateway sandbox mode, a real-but-unverified Google Calendar OAuth app (§14), real push subscriptions (real VAPID keys) to prove delivery actually works before production. Transcription has no sandbox mode — staging usage is real (billed) usage, on a testing budget.

**PRODUCTION**
- A separate Supabase project from staging — no shared project, no shared data, no shared auth users, ever.
- Live credentials for every integration (payment gateway, verified Calendar OAuth app, transcription API, VAPID keys).
- Production data only, never seeded from or shared with staging.

### 12.2 Local Development & Local-First Persistence

- **Local persistence**: IndexedDB (§12.4), covering Pause history, Practice progress, Journal/Reflections, Highlights, Patterns/Growth inputs, preferences, and saved Pauses — everything except the remote-only entities in §12.3.
- **Local development**: `npm run dev` works with zero environment configuration for Supabase; env-based feature flags gate whether Supabase sync, real Calendar, real payments, real push, or real transcription are active, defaulting to off/mocked locally.
- **Mocked integrations**: see LOCAL above — each external dependency sits behind a narrow interface specifically so the mock and the real implementation are interchangeable without touching calling code.

### 12.3 Data Architecture — Sync Boundary

Not everything needs to be remote. Only the Pass entitlement is remote-only by nature; everything else is local-first with optional, additive sync once the real Supabase connection is active. "Unauthenticated" below is a backend/sync-connection state, not a product state — every user already has an account by Entry (§12.6); this table describes what's stored locally versus synced once real Supabase is wired up, not whether an account exists.

| Entity | Local (pre-real-Supabase) | Synced once Supabase is connected | Notes |
|---|---|---|---|
| Journal | Yes — full read/write | Yes | Local-first write, background sync (§12.5) |
| Highlights | Yes | Yes | Same sync model as Journal |
| Practice progress | Yes | Yes | The existing chakra engine already works this way locally today |
| Reflections | Yes | Yes | A role on Journal (§4), not a separate store or sync path |
| Patterns | Yes — the generation call can run over local-only history pre-auth | Yes | Persistence and cross-device continuity require auth; generation itself doesn't |
| Growth | Yes — always computed on read | N/A (never itself persisted) | Derived from Journal/Pause history, local or synced, whichever is current |
| Preferences | Yes | Yes | Nice-to-have sync, not a core product promise |
| Saved Pauses | Yes | Yes | |
| **Pass entitlement** | **No** | **Always remote, no local-only mode** | The one genuine exception: a local-only paid entitlement is trivially fakeable, and a Pass must survive reinstall/device change (§15) |

### 12.4 Local Storage Engine

Recommend moving off raw `localStorage` (current) to **IndexedDB** for the merged local store (§3) — `localStorage` is synchronous and has practical size ceilings that become a real constraint once Journal/Highlight history grows; IndexedDB is the correct tool once there's more than trivial structured data, and is required groundwork for both the offline write queue (§17) and for running fully Supabase-free locally (§12.2).

### 12.5 Sync Model

Local-first write always, background sync to Supabase when authenticated *and* online, last-write-wins per record (no collaborative-editing scenario exists here, so no CRDT/OT complexity is justified). Sync is additive, never destructive: going offline or staying unauthenticated never loses local data, and authenticating never overwrites local data without first reconciling it (§12.6).

### 12.6 Authentication — Account From the Beginning

- Account creation is mandatory at Entry, not optional and not deferred (`PRODUCT_FLOW.md` §39.A) — the product is not anonymous-first. Signup is lightweight: email and password, optionally Google/Apple once implemented. No account-less path into Home exists in the target architecture.
- The first Pause must still be completable without any *further* questions — the only mandatory step before it is the lightweight signup itself, never a questionnaire, mood setup, or profile flow.
- **Local-first persistence before real Supabase is connected is the local implementation of that account's data**, not a separate anonymous data model. There is no "anonymous usage, then later account migration" step to design for; a real-auth implementation pass reconnects the same account to remote sync, it does not merge two different histories. Treat the local/remote sync boundary (§12.3) as connecting one identity to two storage locations, not two identities.
- Entities that are remote-only by nature (Pass, Calendar connection, sending a Gift a Pause) still gate on reaching for them specifically — every user already has an account by the time they reach Home, so this is a Pass/feature gate, not an authentication gate.
- **Code implication, not yet applied**: `proxy.ts`'s route protection was previously relaxed to make every core route public, matching the earlier "no mandatory signup" model. That now needs to be revisited to match "account from the beginning" once real Supabase is connected — out of scope for this documentation pass, flagged for the next implementation pass on Entry/Auth.

### 12.7 Existing Supabase Schema — Disposition

| Table | Disposition | Why |
|---|---|---|
| `profiles` | **Extend** | Add preference and consent columns (§4 UserPreferences/Consent) |
| `journal_entries` | **Retain, extend** | Add a `source` discriminator column (§4's Reflection role) and optional `big_moment_id`/`practice_session_id` references |
| `emotional_analyses` | **Retain as-is** | Already fits the AI-boundary output shape (§9) |
| `healing_sessions` | **Retain, generalize** | Becomes the `Pause` table (§4) — rename conceptually, not necessarily literally; add a `pause_type` column (§4's PauseType enum) |
| `session_feedback` | **Retain as-is** | Already matches Better/Same/Not-better + "What helped?" (§10) |
| `user_patterns` | **Retain as-is** | Exact match for Pattern (§4) |
| `morning_guidance` | **Restructure** | Its shape (message + scheduled_for + delivery_status) is close to `Notification` (§4), but it's currently single-purpose (morning guidance only) and mock-delivery-only — generalize into the real `Notification` table covering all five categories (§13), or retire it in favor of a new table if the shape diverges too far once designed in detail |
| `audio_tracks` | **Retain, defer activation** | Not used for v1 Pause composition (§10 keeps a static local catalog) — kept as-is for when remote-configurable content or paid sound packs (`is_premium`) are actually needed |
| `subscriptions` | **Retain as-is** | Near-exact match for `InnerPausePass` (§4); already has `provider`/`provider_subscription_id` for either payment method (§15) |

No wholesale restructuring needed anywhere in the existing schema — this is additive columns and a small number of new tables (BigMoment, PracticeCheckIn, JourneyHighlight, Notification or a generalized `morning_guidance`, CalendarEvent, SavedPause, GiftedPause), not a redesign.

## 13. Notifications

**Confirmed: real notifications are part of v1** — this supersedes the earlier recommendation to defer push. Guaranteed delivery (the notification arrives even if the app hasn't been opened in days) requires the Web Push API, not just the local Notification API, which only fires while a browser/tab context is alive.

- **Architecture**: Push API + a small server-side trigger. VAPID key pair (staging and production each have their own — §12.1), a `push_subscriptions` table (new — endpoint + keys per device, `auth.uid()`-scoped like everything else), and a scheduled server-side job (Supabase Edge Function or equivalent) that evaluates the deterministic rules (§8) and calls the Push API for due notifications. The service worker (`public/sw.js`, already exists) gains a `push` event handler to display the incoming notification.
- **Practice, Return to Me, Journey categories**: the *decision* of what/when to send is deterministic (§8) and can run either client-side (while the app is open, via the local Notification API as an immediate/cheap path) or server-side (the scheduled job, for delivery when the app isn't open). A `Notification` record (§4) is written either way, and is what prevents duplicate sends across both paths.
- **Gentle Pause**: content is a **fixed local/server array of prewritten strings**, selected by simple rotation/randomization — no network call for content, no AI, ever (§31, §38 explicit). The delivery mechanism is the same push infrastructure; only the content selection is trivial.
- **Calendar category**: depends on the Calendar backend piece (§14) for event data; once available, uses the same push infrastructure as every other category.
- **Environment behaviour** (§12.1): real push end-to-end only makes sense in staging and production, where real VAPID keys and a real scheduled job exist. Locally, the same trigger logic is fully testable via the local Notification API without a real subscription — the deterministic rules and UI don't need real push plumbing to develop against.

## 14. Google Calendar

**Confirmed: in v1 scope, but must not block other work.** Google's API review/verification process for calendar scopes has a lead time outside engineering's control — the OAuth consent screen submission should start as early as practical (in parallel with unrelated migration steps, §22), and every other track proceeds regardless of where that review stands.

- **OAuth flow**: server-side only. A Next.js API route handles the OAuth redirect/callback and token exchange; refresh tokens are stored server-side (Supabase, RLS-protected, a new column or small table), **never** sent to or stored in the client.
- **Permission model**: read-only calendar scope, minimum necessary (event summaries + times), not full calendar read/write.
- **Event retrieval**: server-side polling or on-demand fetch of the near-term window (next few days), not a full calendar sync.
- **Event classification**: deterministic keyword/rule matching against event titles against the Big Moment type list (§32, §38 — explicitly listed as rule-based, not AI).
- **Contextual suggestion**: server computes "Interview at 3 PM → Take a Pause," client just renders it.
- **Privacy/security boundary**: this is the one integration in the whole document that touches genuinely sensitive third-party data. Store the minimum (event title/time, not description/attendees/location), let the user disconnect and have that immediately revoke stored tokens, and never let calendar data influence anything other than Big Moment suggestions.
- **Environment behaviour** (§12.1): local development uses a fixture list of mock events, never live OAuth — Calendar-dependent UI and the classification rules are fully buildable and testable without Google credentials. Staging uses a real (but unverified, testing-mode) OAuth app, which Google allows for a limited set of test users before full verification completes. Production requires the verified app.

## 15. Payments (assessment only — nothing implemented)

**Confirmed**: UPI + QR + screenshot if straightforward, a payment gateway if straightforward, both offered if both are simple. One Inner Pause Pass — one price, 60-day access, no tiers, no recurring subscription for the initial product (unchanged from `PRODUCT_FLOW.md` §36).

- **UPI + QR + screenshot verification**: lowest engineering lift (no gateway integration, no PCI surface), highest operational lift (someone/something has to review the screenshot — this is not automatable without OCR/fraud-risk, and OCR-based auto-verification is a meaningfully harder, riskier build than it sounds). Realistic v1: manual review queue, not instant automated activation.
- **Payment gateway**: more engineering (checkout integration, webhook handling + signature verification) but fully automated, trustworthy entitlement activation. Razorpay is the natural fit given UPI-first payment intent — offering it alongside direct UPI+QR isn't redundant, since the gateway path can automate the exact same UPI payment method without the manual-review step.
- **Both, if both are simple**: the `subscriptions` table (§4, §12.7) already supports either or both (`provider`, `provider_subscription_id` columns exist) — no schema conflict in offering both simultaneously (e.g. gateway as the default automated path, manual UPI+QR as a fallback).
- **Entitlement**: a single `hasActivePass(userId)` check against `subscriptions.status`/`expires_at`, called only at gated-action time (§8's contextual/checkpoint triggers), never mid-session.
- **Expiry handling**: a session already in progress when a Pass expires completes normally (§13/§40 of `PRODUCT_FLOW.md`) — the entitlement check happens at the *next* gated action, not via any mid-session interrupt.
- **Preserving earned history**: enforced structurally, not by convention — `Pause`, `Practice`, `JournalEntry`, `JourneyHighlight` rows have no foreign key to `InnerPausePass` and are never deleted or hidden by Pass expiry; only *new* paid-depth actions are gated.
- **Environment behaviour** (§12.1): local development uses a mock entitlement toggle, never a real payment flow. Staging uses the gateway's sandbox/test mode and/or a clearly-marked test UPI flow — this is the environment where the manual-review queue and the automated webhook path both get validated against real (test) transactions before production. Production uses live credentials only.

## 16. Gift a Pause

Simplest workable shape: one new table (`GiftedPause` — Pause reference, optional message, random token, created_at, optional expiry) + one public, unauthenticated route `/gift/[token]` that resolves the token server-side and plays that Pause. No recipient account required, no view/analytics tracking, no referral mechanics (explicitly forbidden, §34). The sender does need an account (to have something to gift from), the recipient does not.

## 17. PWA / Offline

- **Already trivial, ship as-is**: Pause audio playback offline — the service worker already does this correctly, including Range requests for seeking (§1). Just needs a cache-eviction policy (§19).
- **Moderate, worth doing but not first**: offline journaling with sync-when-online — needs an IndexedDB write queue (outbox pattern: write locally always, flag unsynced, flush to Supabase on reconnect). This is real but bounded work, feasible once §12's IndexedDB migration lands.
- **Defer**: offline *reading* of full Journey/Pattern/Growth history — requires the remote data to already be cached locally in structured form, which only makes sense after remote sync (§12) exists at all. Don't build offline-read of data that doesn't have a remote source yet.
- Overall: don't over-engineer this. The hard, valuable part (offline audio) is done. The rest follows naturally once §12 lands, rather than needing its own separate offline architecture effort.

## 18. Privacy / Data

- **Journal data**: RLS already scopes every row to `auth.uid()` (§1) — RETAIN this pattern for every new table.
- **Deletion**: `on delete cascade` from `auth.users` is already correctly set up on every existing table (§1) — extend the same pattern to new tables (BigMoment, JourneyHighlight, Pattern-adjacent, GiftedPause with sender reference nulled not cascaded, since a gift link should keep working after account deletion — Gift a Pause is explicitly meant to be given away, not owned).
- **Export**: a straightforward "dump all rows scoped to this user" job — no special architecture needed beyond the RLS boundary already in place.
- **Pattern-analysis consent**: a boolean on Profile (§4), checked before the AI boundary's pattern-generation call (§9) ever runs for that user — the gate lives in front of the AI call site, not in the UI alone.
- **Account deletion**: cascades per the above; `InnerPausePass`/`subscriptions` history should be retained server-side for financial/audit reasons even after account deletion (standard practice), decoupled from the user-facing "your data is gone" promise which applies to Journal/Journey/Practice content.
- **Voice transcription data**: never persisted (§11) — enforced at the point of transcription, not as a later cleanup job.
- **Local vs. remote**: per §12's split.

## 19. Performance

- **Audio**: unifying to one `<audio>` element (§5, §10) removes the current risk of two engines both holding audio resources simultaneously. The service worker's `AUDIO_CACHE` currently has **no eviction policy** — every played track is cached forever with no size cap. This is a real, existing gap (not hypothetical) worth fixing regardless of any other work here: add an LRU-style cap.
- **Animation/waveform**: `WaveformFace` is already CSS/SVG-only, no canvas, no Web Audio analyser — cheap, RETAIN.
- **Low-end devices**: the current design leans heavily on `backdrop-blur` glass panels throughout (`GlassCard`, nav bar, control panels) — this is a genuine GPU cost on older/low-end mobile devices and is worth a deliberate look, not just an assumption that it's fine.
- **Reduced motion**: partially handled today (`.wf-bar`, `.ip-blob-float` have `prefers-reduced-motion` guards) but not systematically verified across every animated element — needs an audit pass, not a rebuild.
- **Memory**: IndexedDB migration (§12) itself is a memory-behavior improvement over unbounded `localStorage` JSON blobs being fully parsed on every read.

## 20. Accessibility

- **Existing good pattern to keep**: `min-h-11` (44px) touch targets are already a consistent Tailwind convention across the codebase — RETAIN as the standing rule for every new component.
- **Keyboard access**: current components mostly use real `<button>`/`<Link>` elements (good baseline); verify focus-visible states are present on every new interactive element, especially the waveform/player controls.
- **Screen-reader semantics**: `aria-label` is already used inconsistently in places (e.g. player controls) — needs a systematic pass as new screens are built, not a retrofit project.
- **Reduced motion**: extend the existing `prefers-reduced-motion` guard pattern (§19) to every new animated element from day one, not after the fact.
- **Contrast**: the gold-on-light-background choice from the Phase 1 theme work (`GoldButton`, `#241b10` text on gold) should get an explicit contrast check as part of implementation — it was a reasonable design call but wasn't formally verified against WCAG AA.
- **Audio controls**: every Pause player needs a non-audio-dependent way to perceive session state (progress text, not just a waveform) — already the pattern in `healing-audio-player-screen.tsx` today, keep it.
- **Typography**: existing serif/sans pairing and type scale (`app/globals.css`) is legible and should carry forward unchanged.

## 21. Testing Strategy

- **Unit** (highest value, lowest cost): every function in `lib/rules/` (§8) — pure input→output, no mocking needed. This is the single best-leveraged testing investment given how much of `PRODUCT_FLOW.md` explicitly demands deterministic behaviour.
- **Integration**: the Practice↔Journey data boundary (§7/§37) — verify Practice-only mechanics never leak into Journal, and that Return responses correctly become JourneyHighlights only when significant.
- **Component**: Pause player (state transitions: Arrive → playing → paused → complete), Practice checkpoint prompts, Big Moment entry screens.
- **Flow/e2e**: extend the existing (currently dormant — Playwright isn't installed) `scripts/mobile-usability-test.mjs` pattern rather than introducing a new framework. Cover the flows `PRODUCT_FLOW.md` §39 names explicitly: First Right Now Pause, Tell Inner Pause, Big Moment Before → (time passes) → Return to Me, Practice session end-to-end through a checkpoint.
- **PWA/offline**: a smoke test that the service worker installs, caches the app shell, and serves a cached audio file with a Range request — regression-tests the one PWA capability that already works today.

## 22. Migration Strategy

Not a rewrite. Eight phases, matching the confirmed development pipeline (Local development → local testing → internal validation → staging → external/friend testing → production). **Every phase through Phase 6 is fully buildable and testable locally, with zero Supabase connectivity required** — Supabase is only actually exercised live starting at Phase 7 (Staging). This is a deliberate sequencing change from an earlier draft of this document, which had "activate Supabase" as an early step; the confirmed direction is that the sync *interface* is built early (Phase 2) so both a local (IndexedDB) and remote (Supabase) implementation can satisfy it, but the local implementation is what everything runs against until staging.

**Phase 1 — Architecture cleanup**
- Unify the audio engine (§5, §10) — one `usePauseEngine`, ports both current playback UIs onto it.
- Unify local persistence (§12.4) — merge `lib/mvp-storage.ts` + `lib/storage.ts` into one IndexedDB-backed store; write a one-time migration for existing users' `localStorage` data.
- Delete the legacy dark app and `lib/providers/*` (§3) — pure subtraction, no dependency on anything else here.

**Phase 2 — Core domain layer**
- Implement `lib/rules/` (§8) as pure, unit-tested functions from day one (§21).
- Define the domain model (§4) in code, and the sync interface (§12.5) that both the local IndexedDB store and the (not-yet-connected) Supabase store will implement.
- Write the Supabase schema migrations for new/extended tables (§12.7) so they exist and are reviewable, without requiring a live connection to develop against.

**Phase 3 — Pause engine**
- Build `lib/pause-engine.ts` (§5): compose, Arrive, Play, Feedback, Completion, including the `center-pause` type (the Ground Pause) as a first-class case, not an afterthought.
- Rebuild Home to the locked spec (`PRODUCT_FLOW.md` §5): Right Now (6 outcomes) + the Tell Inner Pause hero + a compact Moments doorway — **not** Big Moments shown alongside Right Now. Extends the current 5-tile model to 6 outcomes.
- Rebuild the bottom nav to the locked 5-icon shape (`PRODUCT_FLOW.md` §4): Home / Practice / Journey / You as destinations, center **Pause** as a non-destination action using the Harmony Form mark (`BRAND_IDENTITY.md` §7).
- Build Tell Inner Pause as one reusable component, using the Pause engine's compose step (§5) and the AI boundary's text/voice understanding call (§9).
- Build the Moments screen (mode select: Coming up / Happening now / Just happened, reached only via Home's doorway) and the Before/During/After screens (MomentState, Return to Me).

**Phase 4 — Practice engine**
- Rework Practice (§6) — build the Core Practice Arc on the existing chakra engine (relabel/re-checkpoint, no rewrite for this half) **and** add the Ongoing Practice mode/flag + variation/rep/exercise content model, which has no existing equivalent.

**Phase 5 — Journey**
- Rework Journey (§7) — Highlights/Journal/Patterns/Growth structure, built and testable against local history (§12.3 — Pattern generation doesn't require auth to run).

**Phase 6 — Integrations**
All still developed and testable locally against mocks (§12.1):
- Voice → remote transcription (§11), behind its mockable interface.
- Notifications v1 — local-trigger path first, push infrastructure built against local Notification API testing (§13).
- Calendar (§14) — build against local fixture events; **start the Google OAuth review submission at the start of this phase**, in parallel, so its external lead time doesn't push out the rest of the plan.
- Payments v1 (§15) — build against the local entitlement mock.
- Gift a Pause (§16) — small, isolated, can move earlier or later within this phase without blocking anything else.

**Phase 7 — Staging**
- Stand up the staging Supabase project (separate from the future production one, §12.1) and connect the sync interface from Phase 2 to it for the first time.
- Validate every integration in sandbox/test mode: payment gateway sandbox and/or test UPI flow, the real-but-unverified Calendar OAuth app (Google allows a limited test-user set pre-verification), real push subscriptions.
- Offline/sync hardening (§17) — the outbox pattern now has a real remote to flush to, so this is where it actually gets validated end-to-end.

**Phase 8 — External testing**
- Friend/external testers use staging with real accounts.
- Once staging validates cleanly, provision the production Supabase project separately and cut over with live credentials.

## 23. Technical Risks

- **Unbounded service-worker audio cache** — already true today, not introduced by this plan; will get worse as more Pause variety ships. Fix regardless of sequencing above.
- **Two audio engines currently coexisting** — real risk of double-playback/state-desync bugs if new features get built on top of either one before unification (§22 step 1 exists specifically to close this before anything else).
- **Local→remote data migration** — moving existing users' `localStorage` history into Supabase without loss or duplication needs a careful, tested one-time migration, not an assumption that it'll be fine.
- **Calendar OAuth security** — the highest-sensitivity integration in this document; token handling mistakes here are a real privacy incident, not just a bug.
- **UPI/QR/screenshot payment verification** — inherently fraud-prone without a gateway's cryptographic guarantee; needs a genuine operational (not just technical) answer before launch.
- **AI cost/latency at scale** — `/api/analyze` already exists with no visible rate-limiting; extending AI usage to Tell Inner Pause routing and periodic Pattern generation multiplies call volume — needs a cost model, not just a code path.
- **`backdrop-blur` performance on low-end devices** — untested assumption carried through every phase of the visual design so far.
- **Remote transcription cost, latency, and reliability** — now that this is confirmed remote-first (§11) rather than an open on-device/remote choice, its cost and failure modes are a real, standing operational concern, not a hypothetical — the "fall back to text" path needs to be genuinely robust, not an edge case.
- **Push notification cross-browser reality** — Web Push support and behaviour differs meaningfully across browsers/platforms (notably iOS Safari's PWA push support is newer and more restricted than Android/desktop) — "real notifications in v1" needs to be scoped against what's actually deliverable per platform, not assumed uniform.
- **Environment separation discipline** — with three real environments now (§12.1), the operational risk shifts from "does sync work" to "did staging code ever accidentally point at production Supabase, or vice versa" — needs environment-variable/config hygiene treated as seriously as the sync logic itself.

## 24. Open Technical Decisions

The five decisions listed in the previous draft of this document are now resolved by the confirmations at the top of this revision. What remains is narrower — implementation-detail choices with real cost/ownership implications that engineering shouldn't decide unilaterally:

1. **Staging environment provisioning and cost.** A second, always-on Supabase project (plus hosting for the staging build) is an ongoing cost, not a one-time engineering decision — needs budget sign-off, not just a technical go-ahead.
2. **Payment gateway selection.** "A gateway if straightforward" is confirmed, but *which* gateway (Razorpay is the natural technical fit given UPI-first intent) depends on business-entity/country eligibility and existing relationships only the founder side would know — engineering can integrate whichever is chosen, but can't choose it.
3. **Transcription provider selection.** Remote transcription is confirmed (§11); the specific provider is intentionally **not** locked here — select the simplest reliable speech-to-text solution during implementation, evaluated on accuracy, mobile/PWA reliability, latency, cost, privacy, and language support.
4. **Push notification infrastructure: self-hosted vs. managed service.** Self-hosted (own VAPID keys + a scheduled Supabase Edge Function, §13) is the leaner default this document assumes; a managed push service (e.g. OneSignal) trades a recurring cost for less operational work — worth a deliberate choice if operational bandwidth is tight.
5. **Ownership of the Google Calendar OAuth submission.** Not a technical question — someone needs to own the Google Cloud project, the consent-screen submission, and the eventual verification review under a specific account/organization. Worth assigning now, since (§14, §22) that lead time should start as early as possible.

---

### Recommended Target Architecture

Three environments — Local (no Supabase required, IndexedDB + mocked integrations), Staging (real, separate Supabase project, sandbox/test-mode integrations, external testers), Production (separate Supabase project again, live everything) — with local development able to build and test the entire product, including Notifications, Calendar, and Payments against mocks, without ever needing a live backend connection.

One local-first data layer (IndexedDB locally, syncing to the already-existing, currently-dormant Supabase schema once authenticated) — sync boundary defined per entity (§12.3), with only the Inner Pause Pass entitlement remote-only by necessity. One shared audio engine powering every Pause surface. A first-class deterministic rules module (`lib/rules/`) carrying every piece of predictable logic `PRODUCT_FLOW.md` requires to stay rule-based, with AI confined to exactly two call sites — free-text/voice understanding and periodic pattern/insight generation.

Real push notifications and Google Calendar are both in v1 scope, built against local mocks first and exercised for real starting at the Staging phase — Calendar's external Google review process runs in parallel starting early, so it doesn't gate anything else. Remote transcription (not on-device) handles Voice → Journal, with a robust text-entry fallback. Payments support UPI+QR+screenshot and/or a gateway, whichever proves simple, both routing through the same existing `subscriptions` table.

The existing chakra-based Practice engine (for the Core Practice Arc half of §6's model), service-worker audio caching, and design-token/component system are retained and built upon, not replaced. Big Moments, Tell Inner Pause, Return to Me, Gift a Pause, the `center-pause` Ground Pause, and Ongoing Practice are net-new surfaces/mechanics built against this foundation. The legacy dark app is deleted outright.

### Migration Order

1. **Architecture cleanup** — unify the audio engine, unify local persistence (→ IndexedDB), delete the legacy dark app and dead provider abstraction.
2. **Core domain layer** — `lib/rules/`, domain model types (including the `center-pause` PauseType, §4), the local/remote sync interface, Supabase schema migrations written (not yet connected).
3. **Pause engine** — compose/Arrive/Play/Feedback/Completion (including `center-pause`/Ground Pause), rebuilt Home (Right Now + Tell Inner Pause hero + Moments doorway — not Big Moments alongside Right Now), rebuilt 5-icon nav, Tell Inner Pause, the Moments screen and full Big Moments lifecycle.
4. **Practice engine** — Core Practice Arc via relabel/re-checkpoint of the existing chakra engine, plus the new Ongoing Practice mode.
5. **Journey** — Highlights/Journal/Patterns/Growth, Pattern generation working against local history.
6. **Integrations** — Voice (remote transcription), Notifications (local-trigger path, push infra built against local testing), Calendar (against local fixtures, Google review submitted in parallel), Payments (against local entitlement mock), Gift a Pause.
7. **Staging** — first live Supabase connection, integrations validated in sandbox/test mode, offline/sync hardening exercised for real.
8. **External testing** — friend/external testers on staging, then production cutover on a separate Supabase project.

### Decisions Needed From Founder

1. Staging environment provisioning and ongoing cost approval.
2. Payment gateway selection (business-eligibility/relationship dependent, not a technical choice).
3. Transcription provider — TBD, to be selected during implementation against accuracy, mobile/PWA reliability, latency, cost, privacy, and language-support criteria.
4. Push notification infrastructure — self-hosted (VAPID + scheduled function) vs. a managed push service.
5. Ownership of the Google Calendar OAuth submission and verification process.
