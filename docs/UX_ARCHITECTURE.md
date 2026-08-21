# INNER PAUSE — UX ARCHITECTURE v1.0

> Sources of truth: `docs/PRODUCT_FLOW.md` (canonical product behaviour), `docs/TECHNICAL_ARCHITECTURE.md` (technical constraints/capabilities), `docs/FOUNDATION.md` (product philosophy and UX principles).
>
> This is structure, not visual design. No colors, typography, spacing, shadows, gradients, visual styles, component styling, CSS, or animation aesthetics appear anywhere below — those come later.
>
> The existing implementation is evidence only, not the basis for this design. Redesigned from first principles against the three source documents.

---

## 1. Information Architecture

Four destination areas, plus one non-destination center action. Nothing else is a navigation destination — everything else is a state, screen, or experience reached *through* one of these four, or via the center action.

```
Home                          Practice                    Journey                   You
├─ Right Now                  ├─ For You                  ├─ Highlights (default)    ├─ Account
│  └─ 6 outcomes (Sleep,      ├─ Explore                  │  └─ Highlight Detail     │  └─ Inner Pause Pass
│     Reset, Focus,           │  └─ 7 skills (Confidence,  ├─ Journal                 ├─ Preferences
│     Confidence, Calm,       │     Self-Trust,            │  └─ Journal Entry Detail │  └─ Offline
│     Release)                │     Uncertainty,           ├─ Patterns                ├─ Notifications
├─ Tell Inner Pause           │     Emotional Regulation,  └─ Growth                  ├─ Calendar
│  (universal natural-        │     Letting Go, Presence,                             ├─ Data & Privacy
│  language entry point)      │     Self-Compassion)                                  └─ Help & About
├─ Moments doorway            └─ Active Practice journey                                 ├─ Why Inner Pause
│  └─ Moments (mode select)      (Core Practice Arc →                                     ├─ Sound & Traditions
│     ├─ Coming up (Before)      milestone/check-in →                                     └─ Help us build
│     ├─ Happening now           Ongoing Practice;                                            Pause better
│     │  (During)                 Arrive→Tell→Pause→
│     └─ Just happened            Practice→Return)
│        (After)

Home is locked to exactly the three items above (Right Now, Tell Inner
Pause, Moments doorway) — no fourth item, no lower-priority content block.
Offline is a setting within You — Preferences, not its own top-level You
destination (§11 below).

Center nav action (not a destination):
└─ Pause — tap → brief "Get comfortable" transition → the Ground Pause
   begins → Pause Player directly. No screen of its own, no question, no
   mode, no context. `PRODUCT_FLOW.md` §7.

Return to Me — surfaces via notification (if enabled), a contextual
in-app surface when relevant, or the relevant Moment in Journey (not
Home). Locked timing and expiry: `PRODUCT_FLOW.md` §15, §9 below.
```

**Deliberately does not exist** (`PRODUCT_FLOW.md` §4 is explicit on this):
- No separate nav tab for Right Now, Big Moments, Journal, Patterns, or Growth — these are experiences *within* the four areas.
- No separate nav tab or screen for Return to Me — it's a card/contextual surface or notification destination, conceptually part of Journey continuity, never its own place to navigate to.
- The center **Pause** nav position is not a fifth destination — it has no screen, no sub-items, and no state of its own; it is a single action (`PRODUCT_FLOW.md` §4).
- No dashboard, no settings mega-menu, no content library, no "browse everything" screen anywhere — nothing in this IA exists to be browsed for its own sake.

**Naming note, resolved**: "Moments" previously named two different things — Home's doorway into Big Moments (an action/creation flow: choose a mode, optionally start a Pause) and Journey's default view. That collision is now resolved: Journey's default view and its items are named **Highlights** (`Journey — Highlights`, a read-only history of `Highlight` records, §5 below), while **Moments** refers exclusively to the separate Big Moments life-event experience (Home's doorway, the Coming up / Happening now / Just happened modes, and Return to Me's source Moment). See `PRODUCT_FLOW.md` §21/§22/§37 for the canonical terminology.

---

## 2. Screen Inventory

Naming convention: `Area — Screen`. Actions (buttons, taps, dismissals) are never listed here as screens — "Start Pause," "Continue with Pass," "Continue Free," "Skip," and similar are documented as actions within the screens that contain them, not as destinations of their own, per `PRODUCT_FLOW.md` §7's explicit rule that "Start Pause" is a CTA, not a screen.

Two screens are deliberately reused across areas rather than duplicated: **Arrive** and **Pause Player** are the same screen whether entered from Right Now, a Big Moment, or a Practice session — only the context passed into them differs.

### Pause

**Home**
- Purpose: help the user feel different right now, or find the doorway into something that matters — one of the four bottom-navigation destinations (`PRODUCT_FLOW.md` §4). Locked to exactly three sections, nothing else: Right Now, the Tell Inner Pause secondary hero, and the Moments doorway.
- Entry points: app open (authenticated or not), bottom nav, "Return Home" from any completed Pause.
- Exit points: Right Now outcome tap → Arrive/Pause Player; secondary hero tap → Tell Inner Pause — Compose; Moments doorway's "Explore" → Moments.
- Primary action: tap one of the six Right Now outcomes (each with a short subtitle, e.g. "Sleep — Rest deeply").
- Secondary actions: tap the secondary hero ("What's on your mind?") to Write/Speak via Tell Inner Pause; tap "Explore" on the compact Moments doorway ("For what's happening in your life").
- Required state: none — fully functional with zero data.
- Optional state: none — Home has no data-dependent content; it looks identical on day one and day one thousand.
- Skippable: n/a — there is no lower-priority content block anymore. The Moments doorway itself is never mandatory to notice or use.
- Never mandatory: choosing an outcome before doing anything else — free-form Tell Inner Pause is always available as an equal alternative. Moments is never shown expanded on Home; only its single compact doorway is, and even that is skippable. No Continue Practice card, no Return to Me card, no personalized-suggestion card — Home carries none of these.

**Tell Inner Pause — Compose**
- Purpose: let the user say what's happening in their own words and be routed to the right Pause.
- Entry points: Home; Big Moments (Before/After, as the optional expression step); Practice Session — Tell; Journey (where relevant, per `PRODUCT_FLOW.md` §16).
- Exit points: submit → Recommended Pause, in whichever of its three states applies (Clear/Confident, Ambiguous, or Unclear — `PRODUCT_FLOW.md` §16); back/cancel → wherever it was entered from.
- Primary action: Write or Speak.
- Secondary actions: select optional emotion/context chips (only surfaced after input is given, per progressive disclosure, §5).
- Required state: none.
- Optional state: chip selections.
- Skippable: chips entirely; the whole screen is itself optional from every entry point except when it *is* the entry point.
- Never mandatory: choosing chips, or providing both text and voice — either alone is sufficient.

**Recommended Pause** *(three states, per `PRODUCT_FLOW.md` §16 — one screen, not three separate ones)*
- Purpose: briefly show what Inner Pause understood before committing, since (unlike a direct Right Now tap) the intent was inferred, not explicitly chosen — and to do so honestly, matching however confidently it was actually understood.
- Entry points: Tell Inner Pause — Compose only.
- **Clear/Confident state**: a single resolved Pause is shown, with Start Pause as the one action. This is the state the rest of this entry describes.
- **Ambiguous state**: shown when interpretation isn't confident enough for a single resolved Pause. Either one lightweight clarifying question, or a small set (2–3) of candidate Pauses is shown instead of a single recommendation — never both. Candidate presentation must reference back to what the user actually said (e.g. a short line connecting the candidate to their words), not read as bare, unexplained category cards. Tapping a candidate starts that Pause directly (no additional confirmation screen).
- **Unclear state**: shown when there's no usable signal at all. Copy is honest that Inner Pause doesn't have a confident read (never pretends to understand) and offers either a request to say a little more (back to Compose) or a small safe manual continuation (e.g. the six Right Now outcomes). Never loops — this is a single fallback moment, not the start of a conversation.
- Exit points: Start Pause (Clear state, or a tapped candidate in the Ambiguous state) → Arrive/Pause Player; "say more" (Unclear state) → Tell Inner Pause — Compose; back → Tell Inner Pause — Compose.
- Primary action: Start Pause (Clear state) or choose a candidate (Ambiguous state) or say more / pick manually (Unclear state).
- Secondary actions: none in the Clear state (no reason to add options to a screen whose entire job is confirming a single inferred choice); none beyond the candidates themselves in the Ambiguous/Unclear states.
- Required state: an interpretation result (Clear/Ambiguous/Unclear) from the Tell Inner Pause interpretation step. Missing/unavailable AI locally resolves this via deterministic fallback (`PRODUCT_FLOW.md` §16) — the screen and its three states behave identically either way.
- Optional state: the "Why This Pause?" expandable explanation (`PRODUCT_FLOW.md` §9) — Clear state only.
- Skippable: not skippable as a screen, but the choice it shows (Clear or Ambiguous) can be immediately actioned with one tap.
- Never mandatory: reading the "why" explanation; in the Unclear state, providing more detail — the manual fallback is always available instead.

**Arrive** *(shared screen — used by Right Now, Big Moments Before/After, and Practice)*
- Purpose: a brief transition from life into the Pause, for longer/more reflective Pauses only. Shows arrival guidance only (`PRODUCT_FLOW.md` §7) — never playback guidance, and never left on screen once playback starts.
- Entry points: any Start Pause action where the resolved `PauseType`'s rule calls for it (`docs/TECHNICAL_ARCHITECTURE.md` §5).
- Exit points: tapping "I'm ready" advances to Pause Player immediately; otherwise auto-advances after ~30–60 seconds, or immediately for very short/emergency Pauses that skip it entirely.
- Primary action: "I'm ready" — confirms readiness and starts playback immediately. Not required: the auto-advance means no interaction is ever mandatory, but where the user does act, playback waits for that action rather than an arbitrary countdown.
- Secondary actions: none.
- Required state: none.
- Optional state: none.
- Skippable: the entire screen, automatically, for `PauseType`s whose duration rule says so.
- Never mandatory: tapping "I'm ready" — the screen still advances on its own if ignored.

**Pause Player** *(shared screen — used by Right Now, Big Moments, the center Pause nav action, and Practice)*
- Purpose: the sound experience itself.
- Entry points: Arrive (or directly from Start Pause when Arrive is skipped); from the center **Pause** nav action (`PRODUCT_FLOW.md` §4, §7), after its own brief "Get comfortable" transition (not Arrive) — no context, no question, playing the Ground Pause automatically. Still the fastest entry point of all.
- Exit points: natural completion → a brief quiet closing beat → Pause Check-in; manual exit → Pause Check-in directly (never a dead stop).
- Primary action: none required to progress — playback runs on its own.
- Secondary actions: pause/resume, restart, volume/mute, "Why This Pause?" (`PRODUCT_FLOW.md` §9), exit — all explicit controls, never gesture-only (`DESIGN_SYSTEM.md` §13).
- Required state: a resolved Pause (sound environment, frequency layer, duration).
- Optional state: playback guidance text (sparse, pre-authored, deterministic, distinct from Arrive's arrival guidance — `PRODUCT_FLOW.md` §7), quote/grounding cues.
- Skippable: nothing about *listening* is optional once started, but leaving early is always available (exit).
- Never mandatory: engaging with any of the secondary actions.

**Pause Check-in**
- Purpose: "How do you feel now?" — capture outcome and route to the right next step.
- Entry points: Pause Player, on completion or manual exit.
- Exit points: Better → optional Practice recommendation or Return Home; Same → another Pause or Tell Inner Pause; Not better → Tell Inner Pause (first time) or a shifted expression-focused path (repeat, §14).
- Primary action: choose Better / Same / Not better.
- Secondary actions: optional "What helped?" follow-up, when shown.
- Required state: the just-completed Pause.
- Optional state: none.
- Skippable: the whole check-in — "Skip" exits cleanly to Home without penalty (`PRODUCT_FLOW.md` §40).
- Never mandatory: any response at all.

**Moments** *(mode select — internally "Big Moment — Mode Select")*
- Purpose: establish which of the three modes applies — shown to the user as **Coming up — Get ready** (Before), **Happening now — Stay with yourself** (During), **Just happened — Come back to yourself** (After). No named moment tiles appear at this stage.
- Entry points: Home's Moments doorway, via "Explore."
- Exit points: Before / During / After.
- Primary action: choose a mode.
- Secondary actions: back to Home.
- Required state: none.
- Optional state: none.
- Skippable: not skippable itself (a mode must be chosen to proceed), but reachable in two taps from Home (doorway → Explore) — not one, now that mode selection no longer sits directly on Home.
- Never mandatory: nothing beyond picking a mode — no moment identification required yet.

**Big Moment — Before**
- Purpose: prepare for something upcoming.
- Entry points: Moments (mode select).
- Exit points: Start Pause → Arrive/Pause Player.
- Primary action: Start Pause.
- Secondary actions: pick a visual moment tile (e.g. Interview); open Tell Inner Pause — Compose.
- Required state: none — Start Pause works with zero selections.
- Optional state: selected moment tile; Tell Inner Pause input.
- Skippable: moment selection entirely; expression entirely.
- Never mandatory: identifying the specific moment — a generic Before Pause is always available.

**Big Moment — During**
- Purpose: keep steady, right now, with near-zero friction.
- Entry points: Moments (mode select).
- Exit points: Start Pause → Pause Player directly (Arrive is skipped for During by rule — `docs/TECHNICAL_ARCHITECTURE.md` §5).
- Primary action: Start Pause (effectively immediate — this screen is a near-instantaneous pass-through, not a place the user lingers).
- Secondary actions: optional moment/context selection, if the user wants it.
- Required state: none.
- Optional state: moment/context.
- Skippable: everything except starting.
- Never mandatory: any explanation, journaling, or moment identification.

**Big Moment — After**
- Purpose: settle, process, and optionally learn from something that just happened.
- Entry points: Moments (mode select).
- Exit points: Start Pause → Arrive/Pause Player (sound may begin before expression, per `PRODUCT_FLOW.md` §14).
- Primary action: Start Pause.
- Secondary actions: "Want to get it out?" → Tell Inner Pause — Compose.
- Required state: none.
- Optional state: Tell Inner Pause input.
- Skippable: expression entirely ("Skip" is an explicit option, not just an absence of a prompt).
- Never mandatory: any assumption that "let it go" is the right frame — the product must not presume the outcome (`PRODUCT_FLOW.md` §14).

**Return to Me**
- Purpose: follow up on a meaningful, time-bound event after it happened.
- Entry points: a notification tap (`PRODUCT_FLOW.md` §31, if enabled); a contextual in-app surface when relevant; the relevant Moment in Journey — Highlight Detail, always available there regardless of the other two (not Home, which carries no Return to Me card).
- Exit points: response given → Journey — Highlight Detail (updated); dismissed → wherever the user was.
- Primary action: respond to "How did it go?"
- Secondary actions: dismiss without responding.
- Required state: a BigMoment in `awaiting-return` state.
- Optional state: none.
- Skippable: entirely — dismissing is a first-class outcome, not a failure state.
- Never mandatory: this never blocks any other part of the app; it is a surface, never a gate (§9).

### Practice

**Practice Discovery**
- Purpose: choose a skill to work on, guided or self-directed.
- Entry points: bottom nav (Practice tab).
- Exit points: choose a skill → Practice — Skill Introduction.
- Primary action: choose a skill, from either the For You or Explore view.
- Secondary actions: switch between For You and Explore (two states of this one screen, not two screens — a recommendation lens vs. the full list of seven).
- Required state: none (Explore always works with zero history; For You degrades to Explore-like behaviour with no history).
- Optional state: enrollment/completion history, for For You's recommendation and for showing progress on already-started skills.
- Skippable: For You entirely — a user can always go straight to Explore.
- Never mandatory: understanding what "For You" vs "Explore" even means — both lead to the same place.

**Practice — Skill Introduction**
- Purpose: orient before starting or resuming a skill's practice.
- Entry points: Practice Discovery.
- Exit points: Start/Continue → Practice Session — Tell (or Arrive, if the specific session calls for it).
- Primary action: Start (new) or Continue (existing).
- Secondary actions: none needed — this is a short orientation, not a hub.
- Required state: the chosen skill.
- Optional state: prior session history for this skill, if any.
- Skippable: nothing to skip — it's already minimal.
- Never mandatory: none.

**Practice Session — Tell**
- Purpose: "How have things been?" — an open, optional check-in at the start of a session.
- Entry points: Practice — Skill Introduction (or directly, resuming).
- Exit points: response given, or skipped → Arrive (shared screen) or directly to Pause Player.
- Primary action: Write or Speak, freely.
- Secondary actions: skip.
- Required state: none.
- Optional state: prior session's Tell content, for continuity.
- Skippable: entirely — "not every day requires a prescribed question" (`PRODUCT_FLOW.md` §18).
- Never mandatory: any specific question being answered.

**Practice Session — Activity**
- Purpose: the one meaningful activity for this session (writing, reflection, a real-world rep, reframing, observation, a decision or communication exercise).
- Entry points: Pause Player (shared screen), on completion.
- Exit points: complete → Practice Session — Return.
- Primary action: complete the activity.
- Secondary actions: none — one activity, one purpose, per `FOUNDATION.md`'s "every screen has one dominant action."
- Required state: the session's assigned activity.
- Optional state: none.
- Skippable: not the activity itself (it *is* the session), but never blocking — exiting mid-activity is always available, same as exiting a Pause.
- Never mandatory: a specific "correct" way to complete it.

**Practice Session — Return**
- Purpose: "How did that go?" — closes the loop, later.
- Entry points: Practice Session — Activity, on completion; or a later prompt if Return happens asynchronously.
- Exit points: response → stored as Journal material, and promoted to a Journey Highlight if it describes something significant (`PRODUCT_FLOW.md` §18, §37).
- Primary action: respond.
- Secondary actions: skip.
- Required state: the completed session.
- Optional state: none.
- Skippable: entirely.
- Never mandatory: any response format.

**Practice Check-in**
- Purpose: a lightweight milestone reflection at sessions 1, 5, 10, 15, then every 10–15 (`PRODUCT_FLOW.md` §20).
- Entry points: automatically, at the relevant session boundary.
- Exit points: response or skip → back into the normal session flow.
- Primary action: answer the tier-specific single prompt (fit-check / early-signal / progress / adaptation — content per `PRODUCT_FLOW.md` §20).
- Secondary actions: skip.
- Required state: session count for the Practice.
- Optional state: none.
- Skippable: entirely, always.
- Never mandatory: this is never a gate to continuing practice.

### Journey

**Journey — Highlights**
- Purpose: the default view of the user's personal history — "help me understand myself," expressed as things that happened.
- Entry points: bottom nav (Journey tab), default state.
- Exit points: select a Highlight → Journey — Highlight Detail; switch view → Journal / Patterns / Growth.
- Primary action: browse or open a Highlight.
- Secondary actions: switch to Journal, Patterns, or Growth.
- Required state: none (empty state, §13).
- Optional state: BigMoments and their associated Pauses/reflections.
- Skippable: n/a — this is a browsing surface by nature, not a flow with a required next step.
- Never mandatory: nothing here is ever required to use the rest of the product.

**Journey — Highlight Detail**
- Purpose: everything about one Highlight — context, the Pause(s) taken, before/during/after, expression, outcome, any Return to Me.
- Entry points: Journey — Highlights.
- Exit points: back to Highlights; Return to Me action, if awaiting.
- Primary action: read/review.
- Secondary actions: respond to a pending Return to Me, if applicable.
- Required state: the selected Highlight.
- Optional state: none.
- Skippable: n/a.
- Never mandatory: n/a.

**Journey — Journal**
- Purpose: full chronological history — the view, not a separate store (`PRODUCT_FLOW.md` §23).
- Entry points: Journey — Highlights (view switch).
- Exit points: select an entry → Journey — Journal Entry Detail.
- Primary action: browse or open an entry.
- Secondary actions: none required.
- Required state: none (empty state, §13).
- Optional state: JournalEntry history.
- Skippable: n/a.
- Never mandatory: n/a.

**Journey — Journal Entry Detail**
- Purpose: the original expression, unedited, always accessible.
- Entry points: Journey — Journal.
- Exit points: back to Journal.
- Primary action: read.
- Secondary actions: none.
- Required state: the selected entry.
- Optional state: none.
- Skippable: n/a.
- Never mandatory: n/a.

**Journey — Patterns**
- Purpose: observations across history, always correctable.
- Entry points: Journey — Highlights (view switch).
- Exit points: correct a pattern (Relevant / Not really / Tell Inner Pause more) → stays on this screen, updates.
- Primary action: review patterns.
- Secondary actions: correct/elaborate on any pattern shown.
- Required state: enough history for a pattern to have been generated (empty state otherwise, §13).
- Optional state: none.
- Skippable: correcting patterns is optional, but the option must always be present when a pattern is shown.
- Never mandatory: agreeing with any pattern shown.

**Journey — Growth**
- Purpose: show meaningful change over time, never vanity analytics.
- Entry points: Journey — Highlights (view switch).
- Exit points: none required — a terminal, reflective view.
- Primary action: review.
- Secondary actions: none.
- Required state: enough history for a comparison to exist (empty state otherwise).
- Optional state: none.
- Skippable: n/a.
- Never mandatory: n/a.

### You

**You — Home**
- Purpose: manage the account and the product itself.
- Entry points: bottom nav (You tab).
- Exit points: any of Account, Pass, Preferences, Notifications, Calendar, Data & Privacy, Help & About.
- Primary action: choose a destination.
- Secondary actions: none.
- Required state: none.
- Optional state: profile info, Pass status (shown as a summary here).
- Skippable: n/a.
- Never mandatory: none of this is ever required to use Pause/Practice/Journey.

**You — Account / Profile**
- Purpose: manage identity — a signed-in user by construction (`PRODUCT_FLOW.md` §39.A), since account creation happens at Entry; Sign In is available here too, for a returning user on a new device.
- Entry points: You — Home.
- Exit points: back to You — Home.
- Primary action: edit profile.
- Secondary actions: sign out.
- Required state: an account (created at Entry).
- Optional state: profile fields.
- Skippable: profile fields beyond the account itself.
- Never mandatory: an emotional questionnaire, mood setup, daily goal, or any extensive profile setup, at Entry or here.

**You — Inner Pause Pass**
- Purpose: explain and manage the Pass — the "direct" flow (`PRODUCT_FLOW.md` §39.J), distinct from the contextual interruption.
- Entry points: You — Home; You — Account.
- Exit points: purchase → payment flow → back here with updated status; back to You — Home.
- Primary action: purchase, if not active.
- Secondary actions: view status/expiry, if active.
- Required state: none to view; authentication required to purchase.
- Optional state: none.
- Skippable: this entire screen, always — nothing elsewhere requires visiting it.
- Never mandatory: purchasing.

**You — Preferences**
- Purpose: theme, sound, practice, and offline settings.
- Entry points: You — Home.
- Exit points: back to You — Home.
- Primary action: adjust a setting.
- Secondary actions: none.
- Required state: none — sensible defaults always apply.
- Optional state: current preference values.
- Skippable: entirely.
- Never mandatory: none.

**You — Notifications Settings**
- Purpose: opt in/out of notifications — not a schedule builder (`PRODUCT_FLOW.md` §31 is explicit: no user-configured schedules).
- Entry points: You — Home; the permission-request moment itself (§12).
- Exit points: back to You — Home.
- Primary action: toggle notifications on/off.
- Secondary actions: none — no per-category scheduling UI.
- Required state: none.
- Optional state: current opt-in status.
- Skippable: entirely.
- Never mandatory: opting in.

**You — Calendar**
- Purpose: connect/manage Google Calendar.
- Entry points: You — Home.
- Exit points: connect → OAuth (external) → back here, connected; disconnect → back here, disconnected.
- Primary action: connect or disconnect.
- Secondary actions: none.
- Required state: none.
- Optional state: connection status.
- Skippable: entirely — Manual Big Moments work without it.
- Never mandatory: connecting.

**You — Data & Privacy**
- Purpose: transparency and control over what's remembered.
- Entry points: You — Home.
- Exit points: export → download; delete entries/Journey/account → confirmation → executed.
- Primary action: view what's stored.
- Secondary actions: export data; delete individual entries; delete Journey data; delete account; toggle pattern-analysis consent.
- Required state: none.
- Optional state: none.
- Skippable: n/a.
- Never mandatory: n/a — this screen exists so the user is never surprised, not to gate anything.

**You — Help & About**
- Purpose: a short list linking to Why Inner Pause, Sound & Traditions, and Help us build Pause better.
- Entry points: You — Home.
- Exit points: any of the three sub-screens.
- Primary action: choose one.
- Secondary actions: none.
- Required state: none.
- Optional state: none.
- Skippable: n/a.
- Never mandatory: n/a.

**You — Why Inner Pause**
- Purpose: short, human explanation of why the product exists (`PRODUCT_FLOW.md` §29) — not a manifesto.
- Entry points: You — Help & About.
- Exit points: back.
- Primary action: read.
- Required/optional state, secondary actions: none.
- Skippable / never mandatory: entirely optional reading.

**You — Sound & Traditions**
- Purpose: transparent, non-dogmatic education on chakras, frequency, and the traditional-vs-modern distinction (`PRODUCT_FLOW.md` §30).
- Entry points: You — Help & About; the "learn more" tap from the in-Pause "Why This Pause?" explanation.
- Exit points: back.
- Primary action: read.
- Required/optional state, secondary actions: none.
- Skippable / never mandatory: entirely optional reading; never required to believe any of it.

**You — Help Us Build Pause Better**
- Purpose: exact product wording (`PRODUCT_FLOW.md` §28) — a direct feedback channel.
- Entry points: You — Help & About.
- Exit points: submit → confirmation → back.
- Primary action: choose Suggest a feature / Report a bug / Share feedback, then submit.
- Secondary actions: none.
- Required state: none.
- Optional state: none.
- Skippable: n/a.
- Never mandatory: n/a.

### System / Cross-cutting

**Landing / Entry**
- Purpose: a lightweight brand moment, immediately followed by account creation or sign in — explicitly not a mandatory onboarding carousel and not a questionnaire (`PRODUCT_FLOW.md` §39.A).
- Entry points: first app open.
- Exit points: Create account or Sign in → Home.
- Primary action: create an account (email and password; optionally Google/Apple once real authentication is implemented) or sign in.
- Secondary/required/optional state: none.
- Skippable: nothing — account creation is the one mandatory step, and it stays to email and password alone.
- Never mandatory: an emotional questionnaire, mood setup, daily goal, personality quiz, or any extensive profile setup.

**Sign Up / Log In**
- Purpose: create or access an account. The mandatory step of Entry, and also reachable later.
- Entry points: Landing / Entry (first-time, mandatory here); You — Account (a returning user's new device).
- Exit points: success → Home, now authenticated (`docs/TECHNICAL_ARCHITECTURE.md` §12.6).
- Primary action: submit credentials.
- Secondary actions: switch between sign-up/log-in. Password reset belongs to the eventual real authentication implementation.
- Required state: none.
- Optional state: none.
- Skippable: nothing, as the mandatory step of Entry; reachable later from You — Account without being mandatory there.
- Never mandatory: an emotional questionnaire, mood setup, daily goal, or any extensive profile setup, before or after this screen.

**Pass Invitation**
- Purpose: the contextual/checkpoint-triggered offer (`PRODUCT_FLOW.md` §39.I) — distinct from You — Inner Pause Pass.
- Entry points: a paid-depth gate hit, or the fallback immediately after the user's second free Practice session.
- Exit points: Continue with Pass → payment flow; Continue Free → back to exactly where the user was.
- Primary action: choose Continue with Pass or Continue Free.
- Secondary actions: none — both options are peers, not a primary/secondary pair (§14 of this document).
- Required state: a triggering gate or checkpoint.
- Optional state: none.
- Skippable: as a whole, via Continue Free, with zero friction.
- Never mandatory: purchasing; this never blocks the free path it interrupted.

**Gift a Pause — Compose**
- Purpose: send a Pause to someone.
- Entry points: from a Pause (in-context "gift this") or from You.
- Exit points: send → confirmation → back.
- Primary action: choose a Pause and send.
- Secondary actions: write an optional message.
- Required state: authentication (sending requires an account, per `docs/TECHNICAL_ARCHITECTURE.md` §16).
- Optional state: message text.
- Skippable: the message.
- Never mandatory: the message; any tracking/referral step (there is none).

**Gift a Pause — Recipient View**
- Purpose: let the recipient experience the gifted Pause with zero friction.
- Entry points: the shared link, directly (no in-app navigation to it).
- Exit points: Start Pause → Arrive/Pause Player.
- Primary action: Start Pause.
- Secondary actions: read the optional message.
- Required state: a valid share token.
- Optional state: the sender's message.
- Skippable: reading the message.
- Never mandatory: creating an account, signing in, or anything else before experiencing the Pause.

**Total: 40 screens.**

---

## 3. Screen-to-Screen Flows

Notation: `Screen/state → user action → next screen/state`. Every named flow below is kept to the shortest path that satisfies `PRODUCT_FLOW.md`.

**First-time user**
Landing/Entry → (auto) → Home → user chooses Right Now / secondary hero (Tell Inner Pause) / Moments doorway / center Pause action

**Home**
Home → tap Right Now outcome → Arrive (if applicable) / Pause Player
Home → tap secondary hero ("What's on your mind?") → Tell Inner Pause — Compose
Home → tap "Explore" on the Moments doorway → Moments (mode select)
Home (or any screen) → tap the center Pause nav action → brief "Get comfortable" transition → Pause Player, playing the Ground Pause

**Right Now**
Home → tap outcome tile → Arrive (if applicable) → Pause Player *(no context step, no intermediate screen — direct tile taps are one tap by rule, §4)*

**Tell Inner Pause**
Tell Inner Pause — Compose → Write/Speak (+ optional chips) → Recommended Pause → Start Pause → Arrive (if applicable) → Pause Player

**Center Pause action**
Home (or any screen showing the bottom nav) → tap the center Pause action → brief "Get comfortable" transition → Pause Player, playing the Ground Pause *(no Arrive, no context, no question — the transition is not a screen of its own; §4, §7)*

**Big Moments**
Home → Moments doorway → "Explore" → Moments (mode select) → choose Coming up (Before) / Happening now (During) / Just happened (After)

**Before**
Moments (mode select) → Coming up → Big Moment — Before (optional moment tile, optional Tell) → Start Pause → Arrive → Pause Player

**During**
Moments (mode select) → Happening now → Big Moment — During (optional moment/context) → Start Pause → Pause Player *(Arrive skipped by rule)*

**After**
Moments (mode select) → Just happened → Big Moment — After → (sound may begin first) Pause Player → Pause Check-in → optional "Want to get it out?" → Tell Inner Pause — Compose (or skip)

**Pause Player**
Arrive (if applicable) → Pause Player → completion or manual exit → Pause Check-in
*(or, from the center Pause action: brief "Get comfortable" transition → Pause Player, playing the Ground Pause → completion or manual exit → Pause Check-in — no Arrive)*

**Pause completion**
Pause Player → Pause Check-in → Better / Same / Not better → next action (§4)

**Return to Me**
BigMoment reaches `awaiting-return` → notification or Home card → Return to Me → response → Journey — Highlight Detail updated

**Practice discovery**
Practice Discovery → For You or Explore → choose a skill → Practice — Skill Introduction

**For You**
Practice Discovery (For You state) → choose a recommended skill → Practice — Skill Introduction

**Explore**
Practice Discovery (Explore state) → choose any of the 7 skills → Practice — Skill Introduction

**Practice journey**
Practice — Skill Introduction → Start/Continue → Practice Session — Tell (or skip) → Arrive (if applicable) → Pause Player → Practice Session — Activity → Practice Session — Return

**Practice check-ins**
(automatic, at session 1/5/10/15…) Practice Session — Return → Practice Check-in (if milestone reached) → respond or skip → back into normal flow

**Journey Highlights**
Journey — Highlights → select a Highlight → Journey — Highlight Detail

**Journal**
Journey — Highlights → switch view → Journey — Journal → select an entry → Journey — Journal Entry Detail

**Patterns**
Journey — Highlights → switch view → Journey — Patterns → correct a pattern (optional, in place)

**Growth**
Journey — Highlights → switch view → Journey — Growth

**You**
You — Home → choose a destination (Account, Pass, Preferences, Notifications, Calendar, Data & Privacy, Help & About)

**Inner Pause Pass**
You — Home → You — Inner Pause Pass → purchase (if desired) → payment flow → updated status
*(separately: Pass Invitation → Continue with Pass → same payment flow, different entry point, §14)*

**Notifications**
You — Home → You — Notifications Settings → toggle on/off
*(separately: first relevant moment → permission-request prompt → Yes/Not now, §12)*

**Calendar**
You — Home → You — Calendar → connect → external OAuth → back, connected (or declined → back, unconnected, Manual Big Moments unaffected)

**Gift a Pause**
(from a Pause, or You) → Gift a Pause — Compose → choose Pause + optional message → send → confirmation
Recipient: shared link → Gift a Pause — Recipient View → Start Pause → Arrive/Pause Player

**Data/privacy**
You — Home → You — Data & Privacy → view / export / delete individual entry / delete Journey / delete account → confirm → executed

**Help & Feedback**
You — Home → You — Help & About → Why Inner Pause / Sound & Traditions / Help us build Pause better

---

## 4. Branching Rules

> Only branch when the answer changes the experience.

| Point | Branches? | Why |
|---|---|---|
| Right Now direct tile tap | **No** | The tile *is* the complete intent (§2 of `PRODUCT_FLOW.md`'s "outcome-oriented, not diagnostic" framing) — nothing about the experience changes based on further questioning. |
| Tell Inner Pause free text | **Yes** | The whole point of natural language is that it's unpredictable — what's expressed genuinely changes which Pause is right. |
| Big Moment mode (Coming up / Happening now / Just happened) | **Yes** | Each mode has a different duration, different Arrive behaviour, and a different emotional job — this is the one Big Moments decision that must be made explicitly, on the Moments screen (reached via Home's doorway), before any moment tile is shown. |
| Big Moment — specific moment tile | **No, optional only** | Naming *which* moment (Interview vs. generic) enables continuity (`Interview · Before`) but doesn't change the Pause mechanics — skippable without loss of function. |
| Practice — For You vs. Explore | **No** | Both lead to the identical next screen (Skill Introduction) — this is a lens on the same list, not a fork in experience. |
| Practice Session — Tell response | **Weakly** | May inform Pause selection within the session, but never blocks or reroutes the session structure itself. |
| Pause Check-in — Better/Same/Not better | **Yes** | This is the one completion-time branch that must exist — the right next action genuinely differs (§10). |
| Not-better, repeated | **Yes** | First occurrence offers a retry; a second occurrence must *not* offer a third — the branch itself changes shape based on attempt count (§14 below, §10 of `PRODUCT_FLOW.md`). |
| Return to Me response | **Yes** | The response becomes Journal material and potentially a Practice recommendation — genuinely different outcomes depending on what's said. |
| Calendar connected vs. not | **No functional branch** | Manual Big Moments are identical either way — Calendar only ever *adds* a notification trigger, never gates the underlying flow. |
| Free account vs. Pass | **No branch in the core Pause/Moments loop** | Every user is signed in by construction (`PRODUCT_FLOW.md` §39.A) — there is no anonymous state to branch on, so the old "authenticated vs. not" question no longer applies. Pass status gates only the specific paid-depth capabilities named in `PRODUCT_FLOW.md` §36: Practice beyond the free two sessions, and deeper Journey intelligence. Calendar and sending a Gift require an account (universal now) but not a Pass. |

---

## 5. Progressive Disclosure

| Shown | When |
|---|---|
| Right Now's 6 outcomes, the Tell Inner Pause secondary hero, the compact Moments doorway | Immediately, on Home — the complete primary decision surface for what's shown on Home, nothing hidden. |
| Big Moments' three mode options (Coming up / Happening now / Just happened) | Only after tapping "Explore" on the Moments doorway — never shown directly on Home itself (`PRODUCT_FLOW.md` §5). |
| Emotion/context chips | Only after the user has already written or spoken something in Tell Inner Pause — never shown upfront, since they're only useful once there's something to refine. |
| "Why This Pause?" explanation | Only on tap, during playback — present but collapsed by default (§9 of `PRODUCT_FLOW.md`'s "lightweight way to understand"). |
| Practice's full 7-skill Explore list | Only when the user chooses Explore over For You — the default view is a narrower, more decided surface. |
| Practice Check-in prompts | Only at the relevant session-count milestone — never visible or anticipatable before then. |
| Journey's Patterns and Growth | Only once enough history exists to say something real — empty states (§13) explain what will appear, not a placeholder pretending data exists. |
| Pass Invitation | Only at a genuine paid-depth gate or immediately after the second free Practice session — never on arrival, never speculatively. |
| Notification permission prompt | Only at a natural moment of relevance, not on first launch. |
| Calendar/Sound & Traditions/Data & Privacy depth | Only on deliberate navigation into You — never surfaced unprompted. |

The user is never shown the entire product at once: Home alone answers "what do I do right now," and everything else is one deliberate tap away, never pre-loaded into view.

---

## 6. Cognitive Load

Applied to every major flow above:

- **Right Now**: could a step be removed? No — it's already one tap into a Pause. It's the reference minimum for a *chosen* outcome; the center Pause action (below) is faster still, but chooses nothing.
- **Center Pause action**: could this be made even faster? No — it's the floor of the entire product: zero decisions, immediate playback. It exists specifically so getting *some* Pause going is never gated behind even a Right-Now-level choice.
- **Tell Inner Pause → Recommended Pause**: could two screens become one? Considered and rejected — Compose and Recommended Pause have different jobs (expressing vs. confirming an inference) and merging them would make the confirmation feel like part of the same act of expression, muddying "why was *this* chosen."
- **Moments doorway → Moments (mode select)**: could Home show the three modes directly and save a tap? Considered and rejected — a full mode-select surface competing with Right Now's six outcomes and the Tell Inner Pause hero would violate Home's "visually quiet and focused" requirement (`PRODUCT_FLOW.md` §5); the one extra tap through a compact, low-visual-weight doorway is the deliberate trade.
- **Moments (mode select)**: could the system infer the mode instead of asking? Only partially — Calendar can infer *Before* for a known upcoming event, which is exactly why the Calendar-driven notification path skips straight to Before (§32 of `PRODUCT_FLOW.md`) rather than asking again. Manual entry still needs the explicit choice, since there's no signal to infer from.
- **Pause duration**: is the user asked to decide something the product already knows? No — duration is a hardcoded default per `PauseType` (`docs/TECHNICAL_ARCHITECTURE.md` §5); never a picker.
- **Practice Session — Tell**: can it be skipped without cost? Yes, explicitly, every time — the product does not need this answer to function.
- **Pass Invitation**: can it be removed for users who'll never pay? Not removed, but minimized to two moments (contextual gate, Session-5 fallback) rather than a recurring prompt — the fewest touchpoints that still let the offer exist at all.
- **Notifications**: could the settings be simpler? Already reduced to a single on/off — no per-category, no per-time configuration, because `PRODUCT_FLOW.md` §31 explicitly forbids the complexity of a schedule builder.

---

## 7. Pause UX Architecture

Structural states, shared by every Pause-producing flow:

Entry → optional context → Arrive → Playback → completion → feedback → next action

| Stage | Center Pause action | Right Now | Big Moment — Before | Big Moment — During | Big Moment — After | Practice |
|---|---|---|---|---|---|---|
| Entry | Tap the center nav action → brief "Get comfortable" transition | One-tap outcome tile | Doorway → Explore → Moments (mode select) → moment tile (optional) | Doorway → Explore → Moments (mode select) → context (optional) | Doorway → Explore → Moments (mode select) | Skill Introduction |
| Optional context | **Never** — no outcome, no mode, nothing | **Never** (direct tile) — Tell Inner Pause branch only | Moment tile, Tell | Moment/context, minimal | Tell ("want to get it out?") | Tell ("how have things been?") |
| Arrive | **Skipped** — replaced by its own fixed, brief "Get comfortable" transition, not a duration-scaled Arrive | Yes, for longer Pauses | Yes | **Skipped by rule** | Yes | Yes, early sessions; skippable later |
| Playback | The Ground Pause — a fixed grounding/settling composition, ~3 minutes default, never tied to any Right Now outcome (`PRODUCT_FLOW.md` §7) | Standard | Standard, combined intentions possible | Minimal, fastest possible start | May start *before* expression | Standard, followed by the Activity step |
| Completion | Pause Check-in | Pause Check-in | Pause Check-in | Pause Check-in | Pause Check-in, then optional expression | Practice Session — Activity → Return |
| Feedback | Better/Same/Not better | Better/Same/Not better | Same | Same | Same | "How did that go?" (Return), plus periodic Check-in |
| Next action | Continue / retry / Tell | Continue / retry / Tell / Practice recommendation | Continuity: may create a named Moment | Return to normal flow immediately | May become Journey material | Continues the Practice; may trigger a Check-in |

The shared **Arrive** and **Pause Player** screens (§2) mean this table describes *configuration* of one underlying structure, not five different implementations.

---

## 8. Journey Architecture

```
JournalEntry (base layer — every expressive input)
   │
   ├── displayed chronologically as ──► Journal (the view)
   │
   ├── promoted, when significant, to ──► Highlights (something that happened)
   │
   └── analyzed across time into ──► Patterns (recurring observations)
                                        │
                                        └──► Growth (change over time, computed)
```

- **Becomes a Highlight**: a JournalEntry tied to a BigMoment, or a Practice Return response describing a real-world experience Inner Pause recognizes as significant. Not every Pause, not every Practice session.
- **Becomes Journal material (but not necessarily a Highlight)**: Tell responses, Practice reflections, post-Pause feedback, Practice check-ins — anything expressive, always visible in Journal, only sometimes promoted further.
- **Remains Practice-only, never Journal/Journey**: session completion, milestone progress, streak, exercise completion, duration, skipped step — mechanics, not expression (`PRODUCT_FLOW.md` §37's exact boundary).
- **How users move between views**: Highlights is the default landing state; Journal, Patterns, and Growth are reached by switching view from there, not by separate navigation — one screen area, four lenses on the same underlying material.

---

## 9. Continuity Architecture

- **When Return to Me appears**: only for meaningful, time-bound events (a named Big Moment reaching `awaiting-return`) — never after a generic Pause. Locked timing (`PRODUCT_FLOW.md` §15): a calendar-linked Moment triggers shortly after the event's known end time; a manually created Moment triggers the following day, at an appropriate time.
- **Where it appears**: a notification (if enabled), a contextual in-app surface when relevant, or the relevant Moment in Journey (Journey — Highlight Detail, §2) — always findable there regardless of whether the notification/contextual surface was seen. **Not** on Home, which is locked to Right Now / Tell Inner Pause / the Moments doorway only (§2). Never a tab, never a dedicated nav entry (§1).
- **How it expires**: maximum one follow-up per Moment. Once that follow-up has been sent (responded to or not), `MomentState` moves to `resolved` and it stops being actively surfaced — locked in `PRODUCT_FLOW.md` §15.
- **What happens when ignored**: active surfacing stops after the one follow-up; ignoring it is never penalized, never repeated, and never blocks anything else. The Moment's full record remains fully intact and visible in Journey — nothing is hidden or deleted, only the active follow-up stops.
- **How it links back to Journey**: a response becomes a Journal entry and, since it's describing something that happened, typically completes the Moment it belongs to — visible immediately in Journey — Highlight Detail.

---

## 10. Account / Signup Architecture

- **Account from the beginning**: Entry's mandatory step is Create account or Sign in (`PRODUCT_FLOW.md` §39.A) — the product is not anonymous-first. Product history belongs to the account from the first Pause onward.
- **Lightweight signup, not a questionnaire**: Create account asks for email and password only, optionally Google/Apple once real authentication is implemented. No emotional questionnaire, mood setup, daily goal, personality quiz, or extensive profile setup is ever asked before Home.
- **Account creation**: the Sign Up / Log In screen, reached mandatorily from Landing / Entry for a first-time user, or optionally from You — Account for a returning user on a new device.
- **The account is free**: creating an account never requires payment; the Pass (§11) is a separate, optional purchase reachable only from within an already-created account.
- **Local-first persistence, pre-real-auth**: where local-first storage is used before real Supabase/auth is connected, it is the local implementation of that account's data, not a separate anonymous data model requiring a later migration step. A future real-auth pass reconnects the same account to remote sync; it does not introduce a merge between two different histories.

---

## 11. Monetization UX Architecture

- **Contextual Pass invitation**: appears only at a genuine paid-depth gate, or immediately after the user's second free Practice session as a fallback — never speculatively, never on arrival. Both options ("Continue with Pass" / "Continue Free") are framed as continuation of the same journey, not accept/reject (`PRODUCT_FLOW.md` §39.I).
- **You → Pass**: a separate, calmer flow for users who go looking for it themselves — status/explanation first, purchase if desired, without the "continue" framing that only makes sense for an interruption.
- **Free vs. paid experience**: free is a real, complete product on a free account — Right Now, the Ground Pause, Tell Inner Pause, core Moments (never quota-limited), the *complete* Journal and Highlights history, basic recent Patterns, basic Growth where supported, two Practice sessions total from one chosen skill, preferences, notifications, Calendar settings, Data & Privacy controls, and core Help/About (`PRODUCT_FLOW.md` §36). Paid unlocks the full Core Practice Arc across all seven skills, Ongoing Practice, deeper Practice personalization, and Journey *intelligence* specifically — longitudinal pattern analysis, deeper cross-entry connections, and Growth comparisons over time — never the underlying history itself, and nothing beyond what's named (no vague "advanced insights," "deeper continuity," "advanced Moments," or other undefined placeholders).
- **60-day Pass**: a fixed window, independent of Practice's own ongoing/milestone structure — a Practice journey never expires just because the Pass window closes mid-journey.
- **Pass expiry**: paid-depth functionality becomes unavailable at the *next* gated action, never mid-session — an active Pause always completes normally.
- **Preserving earned history**: Journal, Highlights, Practice history, Reflections, Growth, saved Pauses, and Moment history all persist through and after expiry, unconditionally.
- **No-pressure principles**: no countdowns, no fake scarcity, no streak-loss framing, no repeated nagging — the offer reappears only at the next natural gate, never as a loop.

No pricing is defined here, per instruction.

---

## 12. Notification UX Architecture

| Category | Destination |
|---|---|
| Practice | The relevant Practice (Skill Introduction or in-progress session). |
| Return to Me | The relevant Moment / Return to Me experience. |
| Calendar | The relevant Before Pause (Big Moment — Before, pre-filled with the calendar-sourced moment). |
| Journey | The relevant Pattern or Growth insight. |
| **Gentle Pause** | **No destination, no CTA.** Tapping (or not) simply dismisses it — it exists to give something, not to pull the user back into the app. |

Permission is requested with a value-first framing ("occasionally bring you something good... not here to bring you back to the app"), Yes/Not now as equal options, and declining never degrades any other part of the product.

---

## 13. Edge States

| State | UX response |
|---|---|
| First-time user | Landing → Home directly; no forced tour, no empty-state anxiety since Right Now works immediately. |
| Empty Journey | Highlights/Journal/Patterns/Growth each show a plain explanation of what will appear and why, never a fake/placeholder preview. |
| No Practice yet | Practice Discovery works fully via Explore; For You degrades gracefully to a general starting suggestion rather than failing. |
| No Highlights yet | Journey — Highlights explains that Highlights come from Big Moments and significant Practice reflections — an invitation, not a dead end. |
| Skipped reflection | Exit cleanly to Home; never punished, never re-prompted immediately. |
| Pause did not help | Offer Tell Inner Pause or a different Pause — one retry path, clearly presented. |
| Repeated Pause did not help | No third sound-based retry offered — shift explicitly to expression/reflection or let the user leave; never an endless loop (`PRODUCT_FLOW.md` §10). |
| Offline | Cached Pauses still play; journaling/reflection saves locally and syncs when back online — never a hard failure. |
| Transcription failure | Fall back to plain text entry immediately — Speak was always an accelerator for Write, never a requirement. |
| Tell Inner Pause input is ambiguous | Recommended Pause's Ambiguous state: one clarifying question or a small candidate set connected back to what the user said — never bare category cards, never both a question and a candidate set (`PRODUCT_FLOW.md` §16). |
| Tell Inner Pause input is completely unclear | Recommended Pause's Unclear state: an honest "say a little more" or a safe manual fallback (e.g. Right Now's six outcomes) — never a pretense of understanding, never a repeating loop (`PRODUCT_FLOW.md` §16). |
| AI unavailable locally (no `OPENAI_API_KEY`) | Deterministic fallback resolves the same Clear/Ambiguous/Unclear states — the product experience is identical to when AI is available; this is a local-development detail only (`PRODUCT_FLOW.md` §16). |
| Notification permission denied | Product continues normally; the ask is not repeated on every session. |
| Calendar denied/disconnected | Manual Big Moments remain fully available and identical in every way. |
| Pass expired | History and all earned content remain visible and intact; only new paid-depth actions are gated, discovered at the next relevant tap, not announced disruptively. |
| Pass expires during an active session | The session completes exactly as if nothing happened; the gate is only checked on the *next* gated action. |
| Deleted data | Confirmed clearly before executing; once executed, no retained copy anywhere designed to survive the deletion. |

---

## 14. UX Rules

Implementation-facing laws, derived directly from `FOUNDATION.md` and `PRODUCT_FLOW.md`:

1. One primary purpose per screen; one dominant action per screen.
2. No question is asked unless the answer changes the experience.
3. No unnecessary questionnaire before value — account creation at Entry stays to email and password, and the first Pause follows immediately after.
4. The user can always skip expression — Write/Speak is never mandatory where it appears.
5. The user can always return to Home from anywhere without penalty or confirmation dialogs.
6. Where a decision is predictable, the system infers it — duration, Arrive/skip, and routing are never asked when a rule already knows the answer.
7. Never create a screen where a state or a single action is sufficient — "Start Pause," "Continue with Pass," and similar remain actions, not destinations.
8. Direct, explicit intent (a tile tap) is never re-questioned; only inferred intent (free text, calendar inference) may branch.
9. Every optional step is visibly optional — never a hidden requirement disguised as a suggestion.
10. Nothing in Practice, Journey, or Notifications is ever a gate to using Pause.
11. AI never decides routing, timing, or scheduling — only interprets free-form meaning and surfaces patterns, always correctable, never overwriting the user's own words.
12. Repeated failure (Not-better, twice) changes the offered path — the product never repeats an approach that's already been shown not to help.
13. Earned history is never deleted, hidden, or put at risk by Pass expiry, account changes, or authentication.
14. Every notification category except Gentle Pause has exactly one clear destination; Gentle Pause has none, by design.
15. Whitespace and restraint are structural requirements, not decoration — nothing is shown "because it's available," only because it changes what the user does next.
