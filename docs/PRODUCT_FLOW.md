# INNER PAUSE — PRODUCT FLOW v1.0

> This document is the canonical product-flow and experience blueprint for Inner Pause.
>
> It consolidates the agreed product decisions into one coherent document — both the product/experience logic and the screen-by-screen user flows and transitions.
>
> Anything explicitly marked as future/later is future, not v1.

---

## 1. Product Promise

Inner Pause exists around one core promise:

> Feel better now. Become better over time.

Inner Pause is an emotional fitness platform where sound is the primary interface.

Sound is the intervention, not the entire product.

The long-term objective is not simply relaxation or more time in the app. The goal is helping people build emotional skills and respond to life better after they leave the app.

**Core product loop:**

Life happens → user expresses / chooses what is happening → Pause → reflection → behaviour → memory → return → practice → growth

The user should gradually feel:

> "This app remembers me."

and:

> "I have built something here."

---

## 2. Core Product Model

Inner Pause has four core product areas.

### PAUSE

Job: **Help me now.**

Pause is the product area behind the app's entry experience. It contains two major routes:

- **Right Now** — help me feel different right now.
- **Big Moments** — help me through something that matters. Reached from Home via a compact "Moments" doorway (§5), not shown as a full section on Home itself.

**Home** is the screen/tab where this area lives (§5). **Pause** is also the name of a separate center navigation action (§4) — a single tap that immediately begins a generic Pause, with no question and no screen of its own.

A single sound experience/session is called a **Pause**. This terminology is part of the brand vocabulary.

Examples: Take a Pause · Start a Pause · Sleep Pause · Confidence Pause · Before the Interview — Take a Pause · How did that Pause feel? · Return to your Pause.

### PRACTICE

Job: **Help me become better at something.**

Practice is long-term emotional skill development. Current seven core skills:

1. Confidence
2. Self-Trust
3. Uncertainty
4. Emotional Regulation
5. Letting Go
6. Presence
7. Self-Compassion

Practice is not a library of audio tracks and not a fixed course. It is an ongoing, personalized journey.

### JOURNEY

Job: **Help me understand myself.**

Journey is the user's personal history. Default hierarchy:

Highlights → Journal → Patterns → Growth

Journal/history is the source material. Patterns and growth are interpretations built on top of the user's actual experiences.

### YOU

Job: **Help me manage my Inner Pause.**

You contains: account · Inner Pause Pass · preferences · theme · notifications · calendar · offline · privacy/data · help · "Why Inner Pause" · "Sound & Traditions" · "Help us build Pause better."

---

## 3. Global Product Principles

- Always find the cleanest route from user intent to value.
- Remove steps before adding features.
- The user should never have to understand Inner Pause's internal taxonomy.
- The user may choose a direct route or simply tell Inner Pause what is happening.
- Every screen should have one primary purpose.
- No question should be asked unless the answer changes what the product does.
- No unnecessary questionnaire before first value. Account creation is part of Entry and stays lightweight: email and password, nothing more.
- No pressure to create an account.
- No pressure to pay.
- The user should feel that they are building and earning their Inner Pause experience through participation.
- Free should feel like a real product, not a demo.
- The app should not manipulate the user into returning.
- Sometimes Pause should give without asking for anything back.
- Rules should handle predictable product behaviour. AI should be used for unknown meaning, not deterministic flows.

> Core principle: **Rules for known behaviour. AI for unknown meaning.**

---

## 4. Navigation

Final bottom navigation, five icons: **Home · Practice · Pause · Journey · You**

Four are destinations: **Home** (§5), **Practice** (§17), **Journey** (§21), **You** (§27). The center **Pause** is not a fifth destination — it is an action, not a screen. It uses the Inner Pause logo/mark as its visual control and behaves like a simple music-player action (e.g. a shutter/record button), not a navigable tab.

**Tap Pause → a brief "Get comfortable" transition → the Ground Pause begins.** No question. No mode selection. No context selection. This is the single fastest route into a Pause in the entire product — faster than a Right Now tile tap (§6), since it doesn't even ask which outcome. Full behaviour, naming, and duration are locked in §7.

No separate tabs for Right Now, Big Moments, Journal, Patterns, or Growth — these are experiences within the four destination areas, or, for the fastest generic case, the center action.

---

## 5. Home

Home is the app's landing screen and one of the four bottom-navigation destinations (§4) — the screen where Right Now and the Moments doorway live. It must remain visually quiet and focused: one primary interaction, one secondary hero, one compact doorway. No additional encouragement card or extra feature beyond what's defined below.

### Primary — Right Now

Prompt: **"What do you need right now?"**

Six Pause choices, each with a short subtitle:

- **Sleep** — Rest deeply
- **Reset** — Start fresh
- **Focus** — Find your flow
- **Confidence** — Feel more capable
- **Calm** — Feel more at ease
- **Release** — Let it go

These are outcome-oriented, not diagnostic emotion labels. Direct tile taps go straight into the Pause — no context step (§6).

### Secondary hero — Tell Inner Pause

Prompt: **"What's on your mind?"**

Copy: *"Say it or write it. We'll help you find the right Pause."*

Write / Speak. The user may use either the six outcomes above or this free-form route.

### Moments doorway

Home does **not** contain a large Big Moments section, and does **not** show the three mode options (Coming up / Happening now / Just happened) directly — those appear only after entering Moments (§11).

Home shows a single compact doorway:

- Heading: **"For what's happening in your life"**
- Copy: *"Before an interview · during a tough conversation · after an argument"*
- Action: **"Explore →"**

Tapping "Explore" enters Moments, where the three mode options (§11) are then shown.

### Home contains only these three sections

Right Now, the Tell Inner Pause secondary hero, and the Moments doorway above are Home's **entire** content. No Continue Practice card, no Return to Me card, no personalized-suggestion card, and no other additional content belongs on Home. This supersedes the earlier "Lower-priority home content" allowance — Home is locked to exactly these three sections and nothing else.

---

## 6. Right Now Flow

**User flow:** Home → tap one of six outcomes → Pause directly (Arrive where applicable, otherwise straight into the Pause Player) → completion feedback → appropriate next action → optionally remember / recommend. Direct tile taps are truly one tap — see the Context rule below.

**Right Now outcomes:** Sleep · Reset · Focus · Confidence · Calm · Release.

**Optional input:** Tell Inner Pause → Write or Speak → optional emotion/context chips → Inner Pause interprets the input → selects the most appropriate Pause → Pause Player.

**Emotion/context chips** are assistive, not mandatory. Example — user says *"I can't stop thinking about my career."* Optional chips: Anxious · Stuck · Behind · Uncertain · Overwhelmed · Low. The user may select none, one, or multiple.

**Context rule (deterministic, not AI-decided):** whether a context step can appear at all is fixed per entry point, not judged case-by-case:
- **Direct outcome tile tap** (Right Now's six tiles, or a Big Moments visual moment tile) — **never** shows a context step. The tile itself is the complete intent; tapping it goes straight into the Pause.
- **Center Pause action** (§4, §7) — never shows a context step and never shows an outcome choice at all. It is the single fastest, most generic route into a Pause in the product — a brief "Get comfortable" transition, then the Ground Pause begins.
- **Tell Inner Pause** (free-form Write/Speak, anywhere it appears) — optional context chips *may* appear, because free text genuinely needs interpretation to route correctly. Chips remain optional even here.
- No other entry point in this document shows a context step.

This is a fixed rule per entry point, decided in advance — not a per-interaction judgment call, and not something AI evaluates at runtime (§38).

---

## 7. Pause Engine

**Generic Pause flow:** Choose / Tell → optional context → Arrive where appropriate → Pause → feedback → next action → remember if meaningful.

**"Start Pause" is a CTA, not a screen.** It is the action of tapping a button — never an intermediate screen of its own. Tapping it takes the user directly into Arrive when applicable, otherwise directly into the Pause Player. Any "Screen: Start Pause" notation elsewhere in this document refers to this action, not a distinct screen to design or build.

**Arrive**: Longer/more reflective Pauses may begin with ~30–60 seconds of transition. Purpose: Life → Inner Pause. Typical copy: *"Get comfortable."* → *"Let your body settle. Nothing else to do."*

**Arrive ends with an explicit readiness confirmation, not a silent countdown.** Arrive shows a **"I'm ready"** action. Tapping it advances to playback immediately. If the user does nothing, Arrive auto-advances once its transition window elapses — the window itself stands in for confirmation, so no interaction is ever *required* (consistent with `UX_ARCHITECTURE.md` §14's "no unnecessary friction" rules), but where the user chooses to act, playback begins **only** after that action. Arrive copy is never shown once playback has started — it fully disappears the moment the Pause begins (see "Arrival guidance vs. playback guidance" below).

**Arrive is not universal — it is deterministic by Pause type, never a dynamic formula:**
- **Right Now**: uses Arrive by default (a 10-minute Pause is long enough to benefit from the transition); very short/emergency variants may skip it.
- **Big Moments — Before / After**: uses Arrive (§12, §14).
- **Big Moments — During**: skips Arrive by rule — near-zero friction is the point (§13).
- **Practice**: uses Arrive for early sessions; may shorten or skip it in later sessions once the ritual is familiar (§18).
- **Center Pause action**: skips Arrive entirely, and has no "I'm ready" step. It has its own brief "Get comfortable" transition instead (§4) — a fixed, short moment before playback, not a duration-scaled Arrive — after which **playback starts automatically**. No question, no context, no mode selection, no Arrive screen.

**Arrival guidance vs. playback guidance are two distinct things, never the same content:**
- **Arrival guidance** — shown only on the pre-playback Arrive screen (or the Ground Pause's "Get comfortable" transition). Its entire job is easing the user from "life" into the Pause. It is never shown again once playback begins.
- **Playback guidance** — a separate, sparse, pre-authored, deterministic set of short lines shown *during* playback (see below). Reusing arrival copy as playback guidance, or leaving arrival copy on screen after playback starts, is not correct behaviour.

**Main Pause**: The actual sound experience. The user should not be forced to choose duration every time — the app chooses an appropriate default. These defaults are **hardcoded by Pause type/mode**, not chosen by AI:
- **Right Now**: 10 minutes.
- **Big Moments — Before**: 2–5 minutes (§12).
- **Big Moments — During**: 30 seconds – 2 minutes (§13).
- **Big Moments — After**: 2–8 minutes (§14).
- **Practice**: follows the session's defined duration (§18).
- **Center Pause action ("Ground Pause")**: ~3 minutes as the initial default — see below. This is a distinct Pause type, not a reuse of any Right Now outcome.

**The Ground Pause (center Pause action) — locked product behaviour:**
- **Flow**: tap the center Pause action → brief "Get comfortable" transition (not Arrive) → the Ground Pause begins → playback, immediately.
- **Intent**: grounding / settling — distinct from all six Right Now outcomes, and explicitly **not** the same as the "Calm" outcome (§5, §6): Calm is a chosen outcome, the Ground Pause is never chosen, only ever the fastest default.
- **Duration**: ~3 minutes as the initial default — deliberately shorter than Right Now's 10 minutes, matching its role as the fastest, lowest-commitment route into a Pause in the entire product.
- **No question, no context, no mode selection, no Arrive.** Starts immediately after the brief transition.
- **Technical representation**: a distinct Pause type/state in the domain model, not a variant or reuse of an existing `PauseType` — see `docs/TECHNICAL_ARCHITECTURE.md` §4/§5 for the corresponding entry.

The product may later adapt these based on context or history (e.g. time available before a calendar event), but that adaptation is a deterministic rule applied to a known input, not AI choosing a routine duration (§38).

During playback: sound · visual sound form · subtle motion · the session-aware content layer, below. The player should remain visually quiet.

**The session-aware content layer.** Inner Pause draws on one shared, sparse, pre-authored content layer, not a live-generated feed and not a separate content system per surface. It exists across Pause, Tell Inner Pause's Recommended Pause, Moments (§11–§14), and Practice (§18) — the same layer everywhere it appears. The intent: the sound feels like it is for the user, the words feel like they are for what the user is going through, and the whole experience feels intentionally composed. Never a random wellness quote feed.

Four content roles, plus one low-frequency fifth:

1. **Session-specific guidance** — the primary role. Short lines relating directly to the Right Now outcome, Practice skill, or Big Moment mode/context, and to session stage where relevant. Tone only, not a locked script: Confidence, *"You don't need to have the perfect answer."* · *"Let yourself speak."* Reset/stress, *"Nothing needs to be solved in this moment."* · *"Give your mind somewhere to settle."* Sleep, *"Let the day become quieter."* · *"There's nowhere else you need to be."* Release, *"You can notice what you're holding without carrying it further."*
2. **Short contextual lines** — short, original, context-specific lines. Never a generic quote feed, a motivational content library, or an endless scrolling section. Tone only: Confidence, *"You can be uncertain and still speak."* Self-Compassion, *"You don't have to earn kindness from yourself."* Letting Go, *"Not everything needs to come with you."* Presence, *"This moment doesn't need your past or your future."* Appears only when it genuinely serves the selected session, never on a fixed schedule for its own sake.
3. **Chakra/frequency/sound context** (§8) — a small amount of context that reinforces the intentional composition. Sparse: roughly one to two informational moments per Pause when appropriate, never continuous education and never a slideshow. "Why this Pause?" (§9) remains the fuller in-flow explanation; this is the brief, occasional cue, not the explanation itself.
4. **Appreciation/gratitude cues** — simple, optional invitations, only where contextually appropriate. Tone only: *"What felt good today?"* · *"What's one thing you're glad happened?"* · *"Notice something you usually overlook."* Never a gratitude module, streak, or daily requirement.
5. **Gentle reminders** — a separate, very-low-frequency supportive role, not scoped to playback alone. Tone only: *"Take your time."* · *"It's okay to pause."* · *"You don't have to figure everything out right now."* · *"You can come back to this when you're ready."* · *"Let today be enough for today."* May appear during an appropriate Pause, between experiences, occasionally on Home or Journey, or occasionally as a notification (§31), when notifications are enabled. Never constant, never guilt-based, never toxic positivity, never telling the user how they should feel, never interrupting an important emotional moment. Silence is often preferable to a reminder. A Pass changes personalization depth elsewhere, never reminder volume. Premium is deeper, not noisier.

Not every session needs every role. A session may contain mostly sound, the Harmony Form, and silence, with one or two guidance lines. That is intentional, not a gap to fill.

**Content is selected using the context already available to the Pause**: Pause type, plus Right Now outcome or Practice skill or Big Moment mode/context, plus session stage where relevant. Selection is deterministic and pre-authored for that context, never live-generated (§38) and never randomized for variety's sake. Avoid repetitive guidance across sessions where the authored set allows it.

**Playback guidance, defined** — the delivery mechanics for roles 1, 2, 4, and 5 specifically during playback (role 3 is governed separately by §8):
- **Sparse** — a few short lines across the whole session, not a running commentary.
- **Pre-authored** — written in advance as content, not generated live.
- **Deterministic** — which lines appear, and roughly when, is decided by fixed rules per Pause duration/type, never chosen at random or by AI at runtime.
- **Changes at selected points during playback** — the line on screen shifts a small number of times over the course of a session (e.g. an opening cue, one or two mid-session cues, a closing cue for longer Pauses; fewer for shorter ones), rather than staying fixed the entire time or updating constantly. Cadence is a deterministic function of Pause duration/type, not a per-session judgment call.
- **Never LLM-generated in real time** — playback guidance is never an AI call. This is deterministic, pre-authored content, same as everything else in §38's "rules for known behaviour."
- **Never constant or rapid** — guidance must never read continuously (e.g. scrolling text, a live commentary) and must never change fast enough to demand attention. It should feel like an occasional, gentle presence, not an active narrator.
- **Distinct from arrival guidance** — playback guidance is its own authored set, never the Arrive/"Get comfortable" line carried forward.

Illustrative tone (content-authoring detail, not a locked script library): *"Notice your breath."* · *"Let your shoulders soften."* · *"Nothing to solve right now."* · *"Stay here for a moment."* · *"Think of one thing you're grateful for."* · *"Take one last slow breath."* Exact wording, count, and per-Pause-type authored sets are a content decision, not fixed by this document. Only the cadence rule, deterministic by duration/type, sparse, never rapid, is locked here.

---

## 8. Sound / Chakra / Frequency Framework

The sound system is not random. Internal logic:

User need / practice intent → traditional chakra inspiration → frequency / tonal layer → sound environment → Pause

**Sound environments** (possible): rain · forest · birds · ocean · wind · bells · singing bowls · ambient textures · gentle instrumental textures · other natural/ambient sounds. The same practice may use different sound environments — the sensory experience can vary while the underlying practice intent remains consistent.

**What the user sees**: During playback, a subtle indicator occasionally shows a short cue such as *"Solar Plexus · 528 Hz"* or *"Grounding,"* with an option to learn more. This is content role 3 of §7's session-aware content layer: roughly one to two informational moments per Pause, not a persistent header or a continuously visible label.

The product must clearly distinguish **traditional inspiration** from **modern interpretation / evidence**. Do not make unsupported claims that a frequency scientifically activates a chakra or guarantees a psychological outcome. This is an authoring constraint on what gets written, not a requirement to show the user a hedging/evidence-disclaimer section — §9's four-part "Why this Pause?" structure (Chakra · Frequency · Together · Why this helps) is the complete, locked, user-facing explanation; it presents traditional inspiration warmly and directly, without a disclaimer paragraph.

**Right Now sound mapping (IMPORTANT, not a blocker)**: the six Right Now outcomes (§5) already have a working chakra/mood mapping in code (`lib/pause-categories.ts`), used as the current starting point. This document does not redefine or change that mapping — it remains exactly as implemented. It has not yet been formally ratified as final; ratify it before committing to final audio content production, but it is not a decision this documentation pass makes or blocks on.

---

## 9. Why This Pause?

The Pause player must provide a lightweight way to understand why the experience was selected. Example: *"Solar Plexus · 528 Hz"* — tap → expandable explanation, collapsed by default, with exactly four parts:

- **Chakra** — the relevant chakra and its traditional association / the inner quality it's linked with.
- **Frequency** — why the tonal/frequency layer is used in this Pause, and how it complements the intention.
- **Together** — one concise statement on how the chakra association and the tonal layer work together for this Pause.
- **Why this helps** — one simple, positive explanation of the overall purpose of the Pause.

The explanation must stay concise and useful — this is a short, warm framing of the Inner Pause sound framework, not an essay.

**Strict rule — never include, anywhere in this explanation:** "Modern perspective" framing, evidence disclaimers, skepticism language, "not scientifically proven," "there is no evidence," defensive scientific caveats, medical guarantees, or long scientific essays. Do not weaken the explanation with disclaimer language. Traditional inspiration is presented on its own terms, warmly and directly — not hedged against.

This exact four-part structure is canonical everywhere "Why this Pause?" appears — the Pause Player and Tell Inner Pause's Recommended Pause screen must use the same structure and the same rule, not two different depths of disclosure.

This strict rule is scoped to this in-flow explanation specifically. It does not apply to §30 Sound & Traditions, a separate, deliberately-sought-out educational area where fuller traditional-vs-modern/evidence discussion remains appropriate — the difference is that §30 is opted into by a user who wants that depth, while "Why this Pause?" sits inside the Pause flow itself and must stay warm and uncomplicated.

---

## 10. Pause Completion

Completion is a quiet transition, not a hard cut: playback ends → a brief, quiet closing beat → **"How do you feel now?"** The closing beat is a short moment (motion and/or a final closing line, e.g. *"Take one last slow breath"* as the last playback-guidance cue), never gamified (no celebratory animation, badge, or sound sting) — it should feel like the natural end of an exhale, not an interruption. This is the product-flow expression of the same moment `BRAND_IDENTITY.md` already describes as the Harmony Form "converging toward stillness" on natural completion. The exact visual mechanic is an implementation detail; the requirement is that the check-in question never simply cuts in the instant playback stops.

After a Pause: **"How do you feel now?"** — Better / Same / Not better.

**Better** — possible actions: Keep this Pause · Continue using it · Recommend a related Practice when appropriate.

**Same** — options: Try another Pause · Tell Inner Pause what's still going on.

**Not better** — do not blindly keep playing more sounds. First occurrence: offer *"Tell Inner Pause what's going on"* (Write / Speak) or trying a different Pause. **If the next intervention also doesn't help**, stop repeatedly recommending more sound — shift toward expression/reflection (Tell Inner Pause) or let the user leave the experience gracefully. Do not create an endless Not-better → new Pause → Not-better retry loop.

**Additional feedback**: the app may ask *"What helped?"* — The sound / Writing / The words / Just pausing. Timing is deterministic, not "appropriate moments" judged case-by-case, and never AI-decided:
- **First ask**: at the first useful opportunity after the user has built up a small amount of real usage (not on the very first Pause — there's nothing to compare yet).
- **After that**: periodic, not every Pause — asked occasionally, not as a routine step attached to every completion.
- The exact cadence (how much "real usage" counts as ready, how "periodic" is spaced) is an implementation/content-tuning detail (**IMPORTANT**, not a blocker) — but the rule itself is fixed: deterministic, occasional, never every time, never on the first Pause.

---

## 11. Big Moments

Big Moments help users through meaningful real-life events. Three modes — **BEFORE, DURING, AFTER** — these are modes, not separate navigation sections. They're presented with the user-facing labels **Coming up** (Before) · **Happening now** (During) · **Just happened** (After).

**Entry pattern**: Home shows only a compact "Moments" doorway (§5) — not the three modes, and not named moment tiles. Tapping "Explore" enters Moments, where the three mode options are shown directly. From there: mode → optional visual moment → optional Write/Speak → Start Pause. Everything is optional except starting the Pause. Named moment tiles (Interview, Presentation, etc.) only appear after a mode is chosen, inside that mode's screen (§12–§14) — never on Home, and never before a mode is chosen.

---

## 12. Big Moments — Before

Purpose: prepare for something upcoming. Shown on Moments as **"Coming up. Get ready."** Typical duration: 2–5 minutes.

User sees Coming up, optional visual moment tiles (Interview · Presentation · Meeting · Difficult Conversation · Big Decision · Exam · etc.), and optional "Tell Inner Pause" (Write / Speak). The user may skip the moment selection completely.

Start Pause. The resulting Pause can combine intentions such as Confidence, Focus, Calm, grounding.

**Continuity**: if the user selected a meaningful named moment such as *Interview*, Inner Pause may create *"Interview · Before"* as a memorable event.

---

## 13. Big Moments — During

Purpose: keep steady, right now. Very low friction. Shown on Moments as **"Happening now. Stay with yourself."** Typical duration: 30 seconds – 2 minutes.

No mandatory journaling. No unnecessary explanation. Sound begins almost immediately. Optional visual moment/context selection remains available. The user may simply start a generic During Pause.

---

## 14. Big Moments — After

Purpose: settle, process, and optionally learn from something that just happened. Shown on Moments as **"Just happened. Come back to yourself."** Typical duration: 2–8 minutes.

Sound may begin first. Then optional expression: *"Want to get it out?"* — Write / Speak / Skip.

Possible needs: Let it go · Make sense of it · Settle down · Learn from it · Just leave it here. Do not assume every difficult event should simply be "let go."

**After → Journey**: meaningful After experiences can become Journey material. Example: Interview → After → Pause → reflection → Moment record.

---

## 15. Return to Me

Return to Me is a contextual continuity experience — not a navigation tab, not a permanent surface, not a monitoring mechanism. It should be used primarily for meaningful, time-bound events.

Example: *Interview · Before* — later: *"How did the interview go?"* — then: response → reflection → memory → possible Practice recommendation.

Other examples: exam · big decision · difficult conversation · fight · important meeting · presentation · result · meaningful event.

Return to Me should **not** trigger after every generic Pause. The user should feel remembered, not monitored.

**Locked flow:**

Moment created → the relevant event passes → Return to Me becomes available → one follow-up → user responds or ignores → active surfacing expires. The underlying Moment itself is never deleted — it simply stops being actively resurfaced. Its full record remains in Journey history (§22), permanently.

**Locked trigger timing (deterministic, not AI-decided):**
- **Known/calendar-linked event** (§32): trigger shortly after the event's known end time.
- **Manually created named moment** (no calendar link): trigger the following day, at an appropriate time.
- **Maximum one follow-up reminder** per Moment — never a repeating nag.
- **If ignored**: stop actively surfacing it. The Moment stays fully visible and intact in Journey — nothing about it is hidden or deleted, only the active follow-up stops.

**Locked location:** Return to Me is an experience/state, not a permanent navigation destination, not its own tab, and **not a permanent Home card** — Home remains locked to Right Now / Tell Inner Pause / the Moments doorway only (§5). It may appear through:
- a **notification**, if notifications are enabled (§31);
- a **contextual in-app surface** when relevant (e.g. surfaced at a moment that makes sense, not parked permanently);
- **the relevant Moment in Journey** (§22) — a user can always find it there even if they never saw or acted on the notification/contextual surface.

It belongs conceptually to Journey continuity (§21–§26), not to a dedicated screen of its own.

---

## 16. Tell Inner Pause

Tell Inner Pause is the universal natural-language route. Available through Pause, Big Moments where useful, Practice, and Journey where relevant.

Input: Write or Speak. Voice handling: Voice → transcription → editable text shown to the user before it's saved → confirmed text becomes the Journal record. By default, original voice recordings are not retained.

**Clear input**: Tell → understand → recommend the appropriate Pause → user starts the Pause. The user is never asked to self-diagnose (pick an emotion, a category, or a chakra) — free expression alone is enough to route confidently.

**Ambiguous input**: when interpretation isn't confident enough to recommend a single Pause, respond with either (a) one lightweight clarifying question, or (b) a small, contextual set of candidate Pauses — never both, and never more than this one extra step. Either way, the response must make it clear Inner Pause is trying to understand what was actually said, not asking the user to categorize themselves — candidate choices must connect back to the user's own words (e.g. reflecting the situation/feeling they described), not appear as bare, unexplained category cards.

**Completely unclear input**: do not pretend to understand. Offer a simple, honest request to say a little more, or a small safe way to continue manually (e.g. the six Right Now outcomes). Never loop this — one honest "help me understand" moment, not a repeating conversation.

**Local AI absence**: if `OPENAI_API_KEY`/equivalent AI access is unavailable (a local-development condition), the product experience must not change — the same Clear/Ambiguous/Unclear states apply, resolved by deterministic fallback logic. This is an implementation detail of local development, never a different intended user experience.

---

## 17. Practice Discovery

Practice presents two conceptual routes:

- **For You** — a personalized recommendation based on what Inner Pause has learned.
- **Explore** — the seven core skills: Confidence · Self-Trust · Uncertainty · Emotional Regulation · Letting Go · Presence · Self-Compassion.

Do not force the user to understand the taxonomy. They can choose or let Inner Pause guide them.

---

## 18. Practice Structure

Practice is ongoing and milestone-based. It is **not** a fixed 21-day course. It also does **not** depend on an undefined, infinite content library — it has a defined shape:

**Core Practice Arc → milestone/check-in → Ongoing Practice.**

- **Core Practice Arc**: a finite, deliberately **authored** progression of sessions for each skill — the initial content a user moves through when starting that skill. Genuinely authored, not generated on the fly, and not open-ended.
- **Milestone/check-in**: completing the Core Practice Arc (and the milestones within it, §20) marks a real transition point, not an arbitrary stopping place.
- **Ongoing Practice**: once the authored core arc is complete, Practice continues — through variations, reflection, real-world behavioural reps, exercises, alternate sound experiences, and continued check-ins/adaptation. This is what makes Practice genuinely "ongoing" without requiring an ever-growing hand-authored session list: the Core Arc is finite and authored; Ongoing Practice is a recurring structure built from a smaller set of reusable elements (variations, reps, adaptation) layered on top of it, not new fixed content authored indefinitely.

Underlying framework, applying to both the Core Arc and Ongoing Practice: Arrive → Tell → Pause → Practice → Return, with periodic Check-in → Adapt.

- **Arrive** — approximately one minute for early sessions. Purpose: transition into practice. Can become shorter or skippable later.
- **Tell** — prompt: *"How have things been?"* The user can freely tell the story of their day, by writing or speaking. Not every day requires a prescribed question.
- **Pause** — sound intervention informed by Practice skill, the user's story, previous feedback, traditional inspiration, and the sound framework.
- **Practice** — one meaningful activity: writing · reflection · real-world behavioural rep · reframing · observation · decision exercise · communication exercise. In the Core Arc, this activity is specifically authored for that session; in Ongoing Practice, it draws from variations/reps/exercises rather than new fixed authored content each time.
- **Return** — later: *"How did that go?"* The answer is stored as Journal material (§23). If it describes a real-world experience Inner Pause recognizes as significant, it may also become a Journey Highlight (§22, §37) — the same Practice↔Journey boundary defined in §37 applies here.

The exact length of the Core Practice Arc (how many authored sessions per skill) is a content-authoring decision, not fixed by this document — it only needs to be genuinely finite and authored, never presented as if it were infinite.

The Pause step draws on §7's shared session-aware content layer, reflecting the selected skill: skill-specific guidance, a skill-relevant contextual line, and an occasional chakra/frequency cue where useful. Not every content role appears in every session; a session may reasonably contain only guidance and the Practice exercise itself.

Free/Pass boundary: see §36.

---

## 19. Practice Personalization

Practice can adapt based on what the user shares, reflections, feedback, what helps, what remains difficult, and real-world behaviour. Customization is natural rather than a large setup flow.

Examples:
- *"I only have 3 minutes."* → shorter version
- *"I don't want to write today."* → sound + alternative exercise
- *"I want to talk."* → voice route

---

## 20. Practice Check-ins

Use deterministic rules for known timing. Checkpoints: Session 1 (baseline/fit) → Session 5 (early signal) → Session 10 (progress) → Session 15 (deeper adaptation) → then approximately every 10–15 sessions.

Check-ins must be lightweight, skippable, useful, and influence future practice. Content stays a simple, single prompt per tier — not a questionnaire:
- **Session 1 (baseline/fit)**: a single fit-check — is this the right practice for you right now, e.g. *"Does this feel like the right starting point?"*
- **Session 5 (early signal)**: what's helping so far, e.g. *"Writing helps me more than sound."* → future sessions adapt accordingly.
- **Session 10 (progress)**: a brief reflection on change so far, drawing on the user's own prior responses where available (§25 Growth).
- **Session 15 (deeper adaptation)**: what should change going forward — the most substantial of the checkpoints, still a single prompt, not a form.
- **Every 10–15 sessions after**: repeats the lightweight early-signal / progress pattern above — not a new mechanic each time.

These checkpoints are the natural markers for the Core Practice Arc → Ongoing Practice transition (§18): the deeper Session 15 checkpoint, or the point at which a skill's authored Core Arc is actually exhausted (whichever a given skill's authored content reaches first), is where Ongoing Practice takes over. This document does not fix the exact session count at which any given skill's Core Arc ends — that's a content-authoring decision (§18) — only that the transition is checkpoint-aligned, not silent.

---

## 21. Journey

Journey's job: **Help me understand myself.** Default experience: Highlights (primary) · Journal (full history) · Patterns (intelligence) · Growth (change).

---

## 22. Journey — Highlights

Highlights are the default visual representation. Examples: *Interview — Aug 12* · *Fight with a friend — Aug 9* · *"I've been feeling behind lately." — Aug 5*.

A Highlight may contain: context · Pause taken · before/during/after · user expression · feedback · outcome · later Return to Me.

---

## 23. Journey — Journal

Full chronological history, including user-created and naturally captured material: text · voice transcription · reflections · Big Moment stories · Practice reflections · periodic check-ins · meaningful feedback. Original user expression remains accessible.

**Journal vs. Journey material**: all expressive user input (Tell responses, Practice reflections, Big Moment stories, meaningful feedback — see §37) becomes stored Journey material. Journal is the user-facing chronological *view* of that material — not a separate store. Not every internal event creates a visible Journal entry: Practice-only mechanics (session completion, milestone progress, streak, exercise completion, duration, skipped step — §37) are never shown here, because they were never expressive in the first place.

---

## 24. Journey — Patterns

Patterns are observations made across history. Examples: *"You mention work uncertainty most often on Sunday evenings."* · *"You tend to feel more unsettled when something is unfinished."*

The user must be able to correct the interpretation: Relevant / Not really / Tell Inner Pause more.

---

## 25. Journey — Growth

Growth should show meaningful change. Examples: *"You used to rate interview anxiety 8/10. Your last three were 5–6/10."* · *"You are recovering faster after difficult workdays."* Avoid vanity analytics.

---

## 26. Journey Trust Principle

Hierarchy: User's words → what Inner Pause notices → how the user is changing.

AI must never replace or overwrite the user's original record. The user's history belongs to them.

---

## 27. You

You is the control/trust area.

- **Account** — Profile · Login · Inner Pause Pass
- **Preferences** — Light/dark theme · Sound preferences · Practice preferences · Notifications · Offline
- **Calendar** — Google Calendar connection, user-controlled
- **Data & privacy** — What Pause remembers · What is used for patterns · AI/pattern controls · Export data · Delete individual entries · Delete Journey data · Delete account
- **Help / About** — Why Inner Pause · How it works · Sound & Traditions · Help us build Pause better

---

## 28. Help Us Build Pause Better

Exact product wording: **"Help us build Pause better"**

Options: Suggest a feature · Report a bug · Share feedback.

---

## 29. Why Inner Pause

Short human explanation of: why Inner Pause exists · why emotional practice matters · why sound is used · why behaviour after the app matters. Keep concise and human — do not turn this into a long manifesto.

---

## 30. Sound & Traditions

Educational content explaining: chakras · traditional associations · frequency · sound · modern interpretation · evidence · uncertainty · Inner Pause's approach. The product must remain transparent and non-dogmatic.

---

## 31. Notifications

Notifications are user-benefit-first. Before browser permission:

> "Want Pause to occasionally bring you something good?"
>
> "Small reminders to breathe, notice, smile or slow down."
>
> "They are not here to bring you back to the app. They are here to help you pause wherever you are."

Options: Yes, send them / Not now.

**Notification categories:**
- **Practice** — help continue a chosen practice.
- **Return to Me** — follow up on meaningful moments.
- **Calendar** — prepare for an upcoming meaningful event.
- **Journey** — share a genuinely useful personal observation.
- **Gentle Pause** — give something without asking anything back. Examples: *"You don't have to solve everything today."* · *"Notice one good thing that's already here."* · *"Unclench your jaw. Drop your shoulders."* No CTA, no sales, no streak, no requirement to open app, no LLM.

Messages are prewritten and selected by deterministic logic. Users do not configure complicated schedules or notification categories.

**Tap destinations**, one per category, fixed:
- **Practice** → the relevant Practice (§17–§20).
- **Return to Me** → the relevant Moment / Return to Me experience (§15, §22).
- **Calendar** → the relevant Before Pause (§32, §12).
- **Journey** → the relevant Pattern or Growth insight (§24, §25).
- **Gentle Pause** → no destination, no CTA. Tapping (or not) simply dismisses it — consistent with "no requirement to open app" above.

---

## 32. Calendar

Google Calendar can be connected. Purpose: *"Let Pause know when something important is coming up."* Calendar is context, not surveillance.

Inner Pause may identify relevant events using simple rules. Example: 3 PM Interview → appropriate time before → *"Big moment coming up. Interview at 3 PM. Take a Pause."* Tap → Before → Interview → Start Pause.

Calendar connection is optional. Manual Big Moments work without Calendar. Calendar should not notify about every event. The user can disable it.

---

## 33. Offline

Offline support is desirable. **Priority**: build in v1 if technically simple with the existing PWA/audio architecture; otherwise defer to Phase 2.

Desired capabilities: downloaded Pauses available offline · selected Practice content offline · journaling offline · syncing when online. Do not create a complicated offline library unless necessary.

---

## 34. Gift a Pause

Flow: Choose Pause → optionally write a message → send. Message is optional. Recipient should be able to experience the Pause through a simple shared link.

No referral points, invite quotas, forced sharing, or growth gamification. Purpose: *"Someone I care about might need this."*

---

## 35. Data & Privacy

Principle: **"Your Inner Pause belongs to you."**

Voice → transcription → text record. Original audio is not retained by default.

User can: view stored material · export data · delete entries · delete Journey data · delete account · control whether entries are used for deeper pattern analysis.

Do not use confusing technical language. Explain simply: what we remember, what we use for personalization, what you can delete.

---

## 36. Monetization

Core philosophy: **"Feel better first. Come on board when you're ready."**

Free should feel like a real product. No arbitrary session limits, countdowns, streak loss, pressure, or fake scarcity. The one deliberate exception is Practice's two-session free sample, defined precisely below — a named product boundary, not an arbitrary restriction.

**Inner Pause Pass** — one clean paid product, one price. No multiple tiers. No recurring subscription model for the initial product. Duration: **60 days**. This duration is a Pass property, not a Practice property — Practice's own milestone structure (§18, §20) is ongoing and open-ended, not a fixed-length course, and runs independently of how long a Pass has been active. Users can take breaks — no journey should expire because the 60-day pass ends halfway through it. The account itself (§39.A) is always free; the Pass is a separate, optional purchase on top of it.

**Free account — the real product.** Every account receives, at no cost and indefinitely:
- Right Now Pauses and the Ground Pause.
- Tell Inner Pause.
- Core Moments (§11–§14) — Coming up, Happening now, Just happened, situation selection, Tell/Speak, the Pause itself, basic Moment persistence, basic Return to Me, and the Journey Highlight connection. Never limited by count (Moments free/paid boundary, below).
- The complete Journal and Highlights history, basic recent Patterns, and basic Growth where supported (Journey free/paid boundary, below).
- Two Practice sessions total, from one chosen skill (Practice free/paid boundary, below).
- Preferences, notifications, Calendar settings, Data & Privacy controls, and core Help/About.

**Practice free/paid boundary — locked, precise.**

Free Practice is exactly **two sessions total, from one chosen skill** — not two sessions per skill, not two sessions per week, not a rotating sample across all seven skills, and not unlimited sampling. Once the user chooses their first skill, both free sessions belong to that skill. The two sessions run the complete Practice method end to end, Arrive → Tell → Pause → Practice → Return (§18), so the user experiences the real thing, not a truncated preview.

After the second free session, a natural continuation point is shown, not an aggressive paywall. Illustrative tone, not a locked script: *"Ready to keep building?"* → *"Continue with Inner Pause Pass."*

Pass unlocks: the full Core Practice Arc across all seven skills, Ongoing Practice, milestone progression beyond the free sample, continued adaptation, and deeper Practice personalization (§19). Practice itself remains Core Practice Arc → milestone/check-in → Ongoing Practice (§18) regardless of Pass status. The Pass changes how much of that structure is reachable, never the structure itself, and Practice is never a fixed-length course.

**Journey free/paid boundary — locked, precise. Never paywall the user's own history.**

**Free, always:**
- The complete Journal (§23) — every entry, unedited, forever.
- The complete Highlights history (§22) — every Highlight, in full.
- Basic reflections — the user's own recorded responses, always visible.
- Basic recent patterns (§24) — a baseline read on recent history.

**Pass unlocks deeper intelligence, not more history:**
- Longitudinal pattern analysis — patterns drawn across a longer history than the free baseline covers.
- Deeper cross-entry connections — relationships the free baseline pattern read doesn't surface.
- Growth comparisons over time (§25) — a "then vs. now" comparative view, not just a single current read.
- Richer, more personalized Journey interpretation.

The user's data and history are never the paid product — access to *more analysis of* that history is. The four Pass-side items above are the exhaustive definition of "deeper Journey intelligence" for this product; nothing beyond them is implied, and this boundary should never be described as "advanced insights," "deeper continuity," or any other undefined premium placeholder.

**Moments free/paid boundary — core Moments are free, unconditionally.**

Coming up, Happening now, Just happened, situation selection, Tell/Speak, the Pause itself, Moment persistence, Return to Me, and the Journey Highlight connection are never gated, never quota-limited, and never interrupted by a paywall. A user who comes to Inner Pause because something important is happening in their life receives help without paying, every time. Emotional support is never rationed.

Potential paid-depth Moment capabilities are not yet defined precisely enough to build: more context-specific Moment pathways, richer situation-specific Pause composition, deeper personalized follow-up, or more advanced Moment-specific practices or sound experiences. Any of these is **FUTURE**, real only once named this precisely and actually implemented, never referred to as "advanced Big Moments" or any other vague premium label. Until then, Moments carries no paid-depth tier at all.

**Earned-product principle**: the user should feel they have built their experience. The app never takes back what the user has earned. When a Pass ends: Journal stays, Highlights stay, Practice history stays, Reflections stay, Growth stays, saved Pauses stay, Moment history stays. The user simply loses access to specifically paid-depth functionality until another Pass is purchased.

**Payment mechanism**: UPI + QR + screenshot verification may be used if simple. A payment gateway may also be integrated if the implementation is straightforward. If both are simple, both may be offered. Do not add multiple payment models.

**When the Pass is first offered**: two deterministic triggers, never a random interruption.

1. **Contextual (primary)** — the first time the user reaches for something that is genuinely paid-depth per the definitions above (a third Practice session, deeper Practice personalization, or deeper Journey Patterns/Growth insight). Shown in that exact moment, so the value gap is self-evident rather than a sales pitch.
2. **Checkpoint (fallback)** — if no contextual gate has been hit yet, the offer may appear immediately after the user's second free Practice session, the natural continuation point defined above, rather than inventing a new touchpoint.

Never shown on first use, never mid-Pause, never interrupting a Big Moment. See §39.I for the full flow and copy.

---

## 37. Practice ↔ Journey Data Boundary

Everything may contribute to Journey, but not everything becomes a Journey Highlight.

**Journal material** (naturally expressive information stored in Journey): Tell responses · Practice reflections · Big Moment stories · meaningful post-Pause reflections · Practice check-ins · meaningful user feedback.

**Practice-only information** (remain Practice mechanics): session completion · milestone progress · streak · exercise completion · duration · skipped step.

**Journey Highlight**: represents something that happened in the user's life. Example: Interview → Before Confidence Pause → interview happens → After reflection → this becomes a Highlight. Practice progress alone is not a Highlight.

> Principle: **Practice records what you practiced. Journey records what happened to you.**

---

## 38. AI Boundaries

AI is not the product. AI is a reflective layer.

**Use deterministic logic for**: session timing · check-in timing · notification rotation · calendar event mapping · known Big Moment follow-up · predictable recommendation rules · feature routing.

**AI may be used for**: understanding free-form text/voice meaning · detecting deeper patterns · interpreting recurring themes · generating meaningful long-term insights · later personalized guidance.

AI should not be called for every routine action.

> Core principle: **Rules for known behaviour. AI for unknown meaning.**

---

## 39. Screen-by-Screen Master Flow

The following represents the intended product flow independent of the current implementation.

### A. First-Time User

Screen 01 — Landing / Entry → Create account or Sign in → Screen 02 — Home → user chooses Right Now / Tell Inner Pause / Moments doorway / center Pause action (§4).

**Landing / Entry is not a mandatory onboarding carousel.** It is a lightweight brand moment plus a lightweight account step, not a multi-step introduction sequence. Create account asks for email and password only, nothing else; optionally Google or Apple once real authentication is implemented. Sign in asks for the same, for a returning user on a new device. Forgot password belongs to the eventual real authentication implementation.

There is **no mandatory questionnaire** before first value. Account creation itself is mandatory and lightweight; an emotional questionnaire, mood setup, daily goal, personality quiz, or any other extensive profile setup before Home is not asked.

### B. First Right Now Pause

Home → Right Now → choose Sleep / Reset / Focus / Confidence / Calm / Release → Start Pause (CTA, §7 — no context step on this direct path) → Screen: Arrive (if applicable) → Screen: Pause Player → Screen: How do you feel now? → Better / Same / Not better → next action.

**Pause → Practice recommendation** (§10 Better): Pause completion → feedback → optional Practice recommendation card, shown only "when appropriate" per §10 → tap → Practice introduction (§39.F entry point). Never forced: dismissible, and dismissing returns cleanly to Home. Applies equally from the Tell Inner Pause flow (§39.C).

### C. Tell Inner Pause Flow

Home → Tell Inner Pause → Write OR Speak → optional emotion/context chips → Inner Pause determines appropriate route → Screen: Recommended Pause → Start Pause → Pause Player → feedback → next step.

### D. Big Moment Flow

Home → "For what's happening in your life" doorway → Explore → Screen: Moments → Coming up / Happening now / Just happened (Before / During / After) → optional moment tile OR optional Write/Speak OR skip context → Start Pause → Pause Player → completion → meaningful-event memory if relevant → Return to Me scheduling if relevant.

**Center Pause action** (§4, §7, distinct from the flow above): from Home, or any screen showing the bottom navigation, tap the center **Pause** action → brief "Get comfortable" transition → Screen: Pause Player directly, playing the Ground Pause (no Arrive, no context, no question) → completion feedback → next action. This is the shortest path in the entire product — shorter than §39.B — and has no screen of its own before playback.

### E. Return to Me Flow

Moment created → the relevant event passes (shortly after a known/calendar-linked event's end time, or the following day for a manually created moment, §15) → Return to Me becomes available → one follow-up (notification if enabled, and/or a contextual in-app surface, and always findable at the Moment itself in Journey) → user responds or ignores → if responded: Journal entry / reflection → possible Practice recommendation → Journey updated; if ignored: active surfacing stops, the Moment itself remains fully intact in Journey.

### F. Practice Flow

Bottom navigation → Practice → For You OR Explore → choose Practice → Practice introduction → Start → Arrive → Tell → Pause → Practice exercise → Return → completion/checkpoint.

At checkpoint: Session 1 (baseline) → Session 5 (early signal) → Session 10 (progress) → Session 15 (adaptation) → every 10–15 later (deeper check-in) → Check-in result → journey adapts.

**Practice → Journey transition**: Return responses and check-in reflections become Journal material (§23). A Return response describing a real-world experience Inner Pause recognizes as significant becomes a Journey Highlight (§22, §37). Practice mechanics alone (session completion, milestone progress, streak) never become a Highlight (§37).

### G. Journey Flow

Bottom navigation → Journey → Highlights default.

From Highlights: Highlight → detail → Pause / reflection / outcome.

Switch to Journal → chronological entries. From Journal: Entry → detail → related Highlight / Practice where relevant.

Patterns → observed pattern → user can confirm / reject / elaborate.

Growth → Practice progress → meaningful changes.

### H. You Flow

Bottom navigation → You → Account → Pass → Preferences → Theme → Notifications → Calendar → Offline → Data & Privacy → Why Inner Pause → Sound & Traditions → Help us build Pause better.

### I. Pass Invitation Flow

Triggered contextually (user reaches for paid-depth functionality) or, as a fallback, immediately after the user's second free Practice session (§18, §36). Never on first use, never mid-Pause, never interrupting a Big Moment.

Both options are framed as a **continuation of the same journey**, not an accept/reject choice — the free path is a complete product, not a holding pattern, and neither option should feel like it's breaking the user's journey.

Screen copy:

> "You've shown up for yourself a few times now.
>
> Inner Pause Pass unlocks full Practice and deeper Journey insight for 60 days, and helps us keep building Inner Pause for you."

Options: **Continue with Pass** · **Continue Free**

- **Continue with Pass** → payment flow (§36 Payment mechanism) → Pass active for 60 days.
- **Continue Free** → dismiss → continue current flow uninterrupted, exactly where the user was.

Does not repeat every session — reappears only at the next natural contextual gate or checkpoint, never as a nag loop.

### J. Direct Pass Flow

Bottom navigation → You → Account → Pass → Pass explanation/status (what it includes, current status if any) → purchase if desired (§36 Payment mechanism).

This is a distinct, separate flow from §39.I. It is user-initiated browsing, not a system interruption — the "Continue with Pass / Continue Free" wording from §39.I is specific to *that* contextual/checkpoint interruption and is not reused here. A user who navigated to Pass themselves hasn't been interrupted, so there's nothing to "continue" from.

---

## 40. Global Edge Case Flows

- **User skips reflection**: Pause → completion → Skip → exit cleanly. Do not punish or nag.
- **User says Pause did not help**: Pause → Not better → Tell Inner Pause OR Try another Pause (§10).
- **User says Pause did not help twice in a row**: do not offer a third sound-based retry. Shift to expression/reflection (Tell Inner Pause) or let the user leave gracefully. No endless retry loop (§10).
- **User finishes a paid Pass**: Pass ends → history remains → Journal remains → Highlights remain → Practice history remains → paid-depth functionality becomes unavailable → user may continue free experience → optional new Pass invitation.
- **Pass expires while a session is already in progress**: the active session completes normally — an active Pause is never interrupted and no progress is ever deleted. Access restrictions apply after completion, or on the next gated action, not mid-session.
- **User chooses Continue Free at the Pass invitation**: dismiss cleanly → continue current flow exactly where the user was → no repeated pressure → offer reappears only at the next natural contextual gate or checkpoint, not on a nag loop.
- **User is offline**: Open Pause → offline-ready Pause → play → journal/reflection locally → sync when online (if offline-supported content exists).
- **User rejects notifications**: Continue using product normally. No repeated pressure.
- **User rejects Calendar**: Manual Big Moments remain fully available.
- **User deletes data**: Delete requested data → confirm clearly → execute deletion → no retention designed to prevent deletion.

---

## 41. Product Success

**Do not optimize primarily for**: time in app · number of sessions · streak length · screen count · content consumption.

**Optimize for**: faster emotional relief · repeated voluntary practice · emotional skill development · better self-awareness · meaningful continuity · healthy habits · long-term behavioural change · user trust · paid conversion through demonstrated value.

---

## 42. Final Product Principle

The user should never feel:

> "I came here to use an app."

They should feel:

> "I came here because something is happening in my life."

And Inner Pause should help them:

**Pause → understand → respond → remember → grow.**

---

## 43. Architecture Reconciliation Note — Local-First vs. Remote Infrastructure

*Implementation guidance, not a product decision. Added to resolve Critical Conflict #4 from the Product Flow consistency audit. This is a mapping of constraints, not the start of implementation — nothing here authorizes building anything.*

The existing build was developed under a local-first, no-backend constraint (`docs/PRODUCT_ROADMAP.md` §9). This document introduces features that cannot honestly be delivered under that constraint unchanged. Backend infrastructure is not assumed wholesale — below is which parts of this document genuinely require it and which do not.

**Genuinely requires remote/backend infrastructure:**
- **Calendar (§32)** — Google Calendar OAuth and API access cannot be done client-only.
- **Inner Pause Pass payments (§36)** — payment verification (UPI/QR/screenshot or gateway) and Pass state that must survive reinstall/device change, to honor the earned-product principle, need server-side, account-tied storage.
- **Gift a Pause (§34)** — a shareable link a recipient can open, possibly without the app or an account, requires a server to host and resolve it.
- **Voice transcription (§16)** — unless done fully on-device (e.g. a browser Speech-to-Text API, with its own quality/availability tradeoffs), accurate transcription typically calls a remote service.
- **Cross-device continuity** ("This app remembers me," §1) — if Journey/Practice history is meant to follow a user across devices rather than stay on one device, that requires remote sync, not local storage.

**Can remain local-first, as today:**
- Right Now Pause selection and playback (§5–§7).
- Big Moments Before/During/After flows and Moment creation (§11–§14).
- Journey — Highlights, Journal, Patterns, Growth (§21–§26) — computable and storable from local data, same pattern as the current Journey tab.
- Practice sessions, milestones, and check-ins (§17–§20) — same pattern as the current progress engine.
- Data & Privacy local controls — export/delete can operate on local storage directly (§35).
- Sound & Traditions, Why Inner Pause, Help us build Pause better (§28–§30) — static content.

**Partial — works locally, but with the same honest caveats already used elsewhere in the current build:**
- **Notifications (§31)** — the Practice, Return to Me, Journey, and Gentle Pause categories can be scheduled via the browser's local Notification API: fires only while the browser/tab context allows it, no guaranteed delivery if the app hasn't been opened recently. The Calendar notification category specifically inherits Calendar's remote dependency above.
- **Return to Me (§15)** — the reminder trigger can be scheduled locally, but reliable delivery days after the user last opened the app is not guaranteed without server-side scheduling.

Nothing in this section changes any product decision above it; it only identifies where the local-first constraint can hold and where it genuinely cannot, so that constraint isn't silently assumed to cover the whole document.
