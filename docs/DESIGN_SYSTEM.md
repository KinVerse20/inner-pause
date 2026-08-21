# INNER PAUSE — DESIGN SYSTEM v1.0

> Derived from `docs/FOUNDATION.md`, `docs/PRODUCT_FLOW.md`, and `docs/UX_ARCHITECTURE.md`. The existing UI is reference material only — this is not a restyle of the current app, it is the visual and interaction foundation built from first principles.
>
> This document defines **foundations**, not screens. No mockups, no component implementations, no application code.

---

## 1. Brand Principles

Inner Pause should feel like the moment right after an exhale — not like an app asking for attention.

- **Quieter than the phone it runs on.** Every screen should feel calmer than the notification that opened it.
- **Premium through restraint, not ornament.** Value is communicated by what's *left out*, not by richness of decoration.
- **Warm, not clinical.** This is emotional fitness, not a medical or therapy interface — no sterile whites, no diagnostic tone.
- **Timeless, not trendy.** No visual choice should read as "2026 wellness app" — the product should look plausible five years from now.
- **Sound-first, screen-second.** The interface exists to get out of the way of the sound experience, never to compete with it.
- **Honest, not mystical.** Chakra and frequency material is presented as supporting context, never as the visual identity of the product itself.
- **One thing at a time.** Every screen carries a single dominant idea, visually as well as functionally — this is a direct extension of `FOUNDATION.md`'s "every screen answers ONE primary question."

---

## 2. Color System

**Light is the default experience.** Dark is a fully supported, equally considered second theme — not an inverted afterthought.

### 2.1 Palette roles

Every surface in the product is described in terms of these roles, never as a raw hex value chosen ad hoc:

| Role | Purpose |
|---|---|
| `background` | The base canvas behind everything. |
| `surface` | Content-bearing areas raised slightly off the background (cards, sheets, the player). |
| `surface-raised` | A surface that needs one further step of separation (a modal over a sheet, a selected card) — used sparingly. |
| `border` | Hairline separation, never a bounding box. |
| `text-primary` | Headings, primary body copy, primary numerals. |
| `text-secondary` | Supporting copy, timestamps, secondary labels. |
| `text-muted` | Captions, disabled/inactive text, least important reading material on the screen. |
| `accent-primary` | The single primary-action color — used for exactly one interactive element's worth of emphasis per screen. |
| `accent-secondary` | Secondary emphasis — selected states, active tab, in-progress indicators. |
| `success` / `warning` / `error` | Reserved for genuine system feedback (save confirmation, permission denial, deletion) — never used decoratively. |
| `chakra-info` | A single, deliberately restrained tone used only for traditional-inspiration/frequency information (§9) — never used for primary UI. |

### 2.2 Light theme (default)

- **Background**: a warm, near-white — not clinical white, not cream-heavy. A paper-like warmth.
- **Surface**: a hair lighter or warmer than background, distinguished by subtlety, not contrast — the product avoids a "card floating on a page" look wherever a simple background shift will do.
- **Border**: a soft warm neutral, low-contrast, used only where two surfaces genuinely need a seam.
- **Text-primary**: a warm near-black (never pure `#000000` — pure black is too harsh against a warm background).
- **Text-secondary / text-muted**: progressively lighter warm greys, never cool/blue-greys, which would fight the warm palette.
- **Accent-primary**: one warm, muted, premium hue (in the violet-to-plum or deep amber family — final exact value is a token decision, not fixed here) used only for primary CTAs and the most important active state on a screen.
- **Accent-secondary**: a quieter second hue used for selection and progress, visually subordinate to accent-primary.
- **Chakra-info**: a soft gold/amber tone, distinct from both accents, so traditional-inspiration text never gets confused with an interactive affordance.

### 2.3 Dark theme

Not an inversion filter — every role is redesigned for the dark context, keeping the same warm identity:

- **Background**: a warm near-black (never a cool slate or pure black), consistent with the brand mark's deep, warm darkness.
- **Surface**: a step lighter than background, still warm, still restrained — never a stark grey card.
- **Border**: low-opacity warm light, only where needed.
- **Text-primary**: a warm near-white (never pure `#FFFFFF`).
- **Accent-primary / accent-secondary**: brightened variants of the light-theme accents, calibrated for contrast on dark rather than simply lightened.
- **Chakra-info**: a warmer, slightly more luminous gold than in light mode, to stay legible without becoming the loudest thing on screen.

### 2.4 Chakra / frequency color use

Chakra and frequency information (§9 below) uses **one consistent supporting tone**, not seven different chakra-branded colors. `PRODUCT_FLOW.md` §8 treats chakra association as *traditional inspiration attached to a Pause*, not a categorization system the user browses by color — giving each chakra its own hue would visually imply a taxonomy the product deliberately avoids (`FOUNDATION.md`: "not a chakra education platform"). Where a Practice skill's traditional lineage needs a subtle visual echo (per `UX_ARCHITECTURE.md`'s Practice — Skill Introduction), it is expressed through the shared chakra-info tone, at low emphasis, never as a category color-coding scheme across the app.

### 2.5 Accessibility contrast expectations

- Body text against its background: minimum **4.5:1** (WCAG AA).
- Large text (headings, numerals used as headings): minimum **3:1**.
- All interactive elements (buttons, chips, toggles) meet **3:1** against adjacent surfaces in both themes.
- Color is never the sole carrier of meaning — see §13.
- Success/warning/error states pair color with an icon or text label, never color alone.

---

## 3. Typography

**Typography carries the hierarchy — decoration does not.**

- **Primary typeface strategy**: a single humanist sans-serif family, used across the entire product (no separate display/serif pairing). One typeface, expressed through weight and size, keeps the interface calm and prevents typographic noise. A single monospaced or tabular-figure font may be used strictly for numeric/data display (§3.6).
- **Heading hierarchy**: three levels only —
  - **H1** — screen-defining headline (one per screen, e.g. "How are you feeling right now?").
  - **H2** — section headers within a screen (e.g. "Continue your practice").
  - **H3** — card/item titles (e.g. a Pause name, a skill name).
  A fourth heading level should not exist; if content needs a fourth level of hierarchy, the screen has too much on it.
- **Body**: one body size for primary reading content, one smaller size for secondary/supporting copy. Line-height generous enough to read as calm, never cramped.
- **Captions**: the smallest text size in the system, reserved for timestamps, metadata, and micro-labels — never used for anything the user must act on.
- **Labels**: a distinct, slightly compressed style (often uppercase-tracked or medium-weight small text) used for button labels, tab labels, and chip text — visually distinct from body copy so interactive text is recognizable at a glance.
- **Numeric/data typography**: session counts, durations, streak numbers, and Pass-expiry countdowns use tabular figures so numbers don't shift width as they change — this is the one place a distinct numeral treatment (weight or tabular spacing) is justified, since these numbers represent progress and deserve a moment of visual weight without becoming decorative.
- **Weight usage**: two weights only across the whole system — a regular weight for body/reading, a medium/semibold weight for headings, labels, and emphasis. No light or thin weights (they undermine legibility and warmth); no heavy/black weights (they read as shouting, which contradicts "emotionally quiet").
- **Maximum text density**: no screen's primary content exceeds roughly three short sentences of running copy at once outside of Journal/Journal Entry Detail (which by nature hold the user's own longer writing). If a screen needs more explanation than that, the explanation belongs behind a "learn more" disclosure (as already established for "Why This Pause?" and Sound & Traditions), not inline.

---

## 4. Spacing and Layout

- **Spacing scale**: a single consistent scale used everywhere (e.g., a base unit multiplied in a small fixed set of steps — micro/tight/base/comfortable/generous/section). No arbitrary one-off spacing values anywhere in the product.
- **Margins**: generous, consistent screen-edge margins on mobile — content should never feel like it's touching the glass of the device.
- **Grid**: a single-column flow on mobile (the primary context, §12); a constrained multi-column grid only where content is genuinely parallel (e.g. the six Right Now outcomes, the seven Practice skills in Explore) — never a dense dashboard grid.
- **Maximum content width**: on larger viewports, reading and primary-action content is capped at a comfortable single-column width rather than stretching edge to edge — width becomes whitespace, not more content.
- **Above-the-fold principles**: on Home, the six Right Now outcomes, the Tell Inner Pause hero, and the compact Moments doorway are all visible without scrolling on a standard mobile viewport — this is the "reach the correct experience within five seconds" principle from `FOUNDATION.md`, applied literally to layout. Home carries no lower-priority content — no Continue Practice card, no Return to Me card, no other module (`PRODUCT_FLOW.md` §5) — so there is nothing that belongs below the fold on Home at all; the three locked sections are the entire screen.
- **Density rules**: whitespace is treated as a required element, not leftover space. When in doubt between fitting more content above the fold and preserving breathing room, breathing room wins — this is a direct, non-negotiable extension of `FOUNDATION.md`'s "Whitespace is a feature."

---

## 5. Shape and Surfaces

- **Corner radius**: one consistent, moderately soft radius family used across cards, buttons, sheets, and chips — soft enough to feel organic and warm, restrained enough to stay premium (not the exaggerated "pill everything" look). A single larger radius step is reserved for full-bleed surfaces like sheets and the Pause player.
- **Surface hierarchy**: background → surface → surface-raised, exactly as defined in §2.1 — no more than these three levels anywhere. If a design needs a fourth level of "raised-ness," the layout has too many nested containers.
- **Border usage**: hairline borders only, and only where a surface change isn't otherwise legible (e.g. a light-theme card against a near-identical background). Where a subtle background-color shift already reads as a seam, no border is added on top of it — borders and background shifts are not stacked as belt-and-suspenders separation.
- **Shadows**: minimal, soft, and used only to indicate genuine elevation (a sheet over content, a floating action), never as a default card treatment. No hard-edged or multi-layered shadow stacks.
- **Elevation**: a maximum of two elevation steps in the entire system — resting (flush with background/surface) and raised (sheets, active player, modals). There is no "elevation ladder" of many intermediate shadow depths.
- **Cards**: used only when grouping genuinely distinct, tappable items (a Moment, a Practice skill, a saved Pause) — never used as a default wrapper for page sections. A page section separated only by spacing and a heading does not need a card around it.
- **Buttons**: shape and radius consistent with the corner-radius family; visual weight communicates hierarchy (§6) rather than size alone.
- **Chips**: the smallest surface unit — used for optional selections (emotion/context tags, category filters), always with a clear selected/unselected state, never used to convey primary actions.

**Avoid unnecessary nested containers**: a card inside a card inside a sheet is a structural failure of this system, not a valid pattern — at most one surface elevation change should occur between the screen background and any given piece of content.

---

## 6. Interaction Hierarchy

Every screen has exactly one **dominant action** — a direct visual expression of `FOUNDATION.md`'s "every screen has ONE dominant action" and `UX_ARCHITECTURE.md`'s per-screen "primary action" field.

- **Primary CTA**: the single highest-emphasis action on the screen (accent-primary fill, largest touch target of the interactive set). Only one primary CTA may exist per screen. Where `UX_ARCHITECTURE.md` explicitly calls out two peer actions (Pass Invitation's "Continue with Pass" / "Continue Free"; Pause Check-in's Better/Same/Not better), both are styled at equal visual weight — a peer choice is never disguised as primary-vs-secondary.
- **Secondary action**: lower emphasis (outline or text-only treatment, no fill) — used for the screen's one or two supporting actions (e.g. "skip," "back," "learn more").
- **Tertiary action**: the lowest-emphasis interactive affordance (plain text, no border, minimal visual footprint) — used for dismissive or optional actions the product doesn't want to compete visually with anything else (e.g. "Not now," "Skip").
- **Destructive action**: uses the `error` role color, always requires confirmation for anything irreversible (account deletion, Journey deletion — per `UX_ARCHITECTURE.md` §13's Data & Privacy flow), and is never styled with more visual weight than the screen's primary CTA.
- **Selected states**: communicated through the accent-secondary role plus a non-color signal (an outline, a check, a fill-weight change) — never color alone (§13).
- **Disabled states**: reduced opacity/contrast on the same shape, never a different shape or removed affordance — the control should still be visually recognizable as "the same button, temporarily unavailable," not disappear or restructure the layout.
- **Loading states**: a quiet, non-intrusive indicator (see §10 Motion) — never a full-screen blocking spinner where a partial/skeleton treatment would preserve context.

---

## 7. Component Principles

These are primitives — reusable design roles, not a component library implementation. A variant is added only when a distinct UX purpose from `UX_ARCHITECTURE.md` requires it, never speculatively.

- **Buttons**: exactly three emphasis levels — primary (filled), secondary (outline/quiet), tertiary (text-only) — matching §6 exactly. No additional button "styles" beyond these three plus the destructive treatment.
- **Chips**: single-line, compact, selected/unselected only (no intermediate "partially selected" state) — used for optional refinement (emotion/context tags in Tell Inner Pause, chakra/traditional-inspiration tag on a Practice skill).
- **Cards**: one card pattern reused everywhere a tappable list item is needed (a Moment, a Journal entry, a Practice skill, a saved Pause) — differentiated by content, not by inventing new card shapes per screen.
- **Inputs**: one text-input pattern (used identically for Tell Inner Pause's Write mode and any account/profile field) and one voice-input affordance (a single, clearly recognizable mic control that visually pairs with the text input as an equal alternative, not a secondary add-on — matching `UX_ARCHITECTURE.md`'s "Write or Speak" framing as two peers).
- **Selectors**: used for the small set of genuine multi-option choices in the product (Big Moment mode select, Better/Same/Not better, Pause Check-in responses) — rendered as a small set of equally-weighted large touch targets, never a dropdown or picker wheel, since every one of these choices is short and benefits from being fully visible at once.
- **Bottom navigation**: five icons, four destinations (Home, Practice, Journey, You, per `UX_ARCHITECTURE.md` §1's Information Architecture) — icon plus label, current-tab state shown via the accent-secondary role plus icon-fill change, never via color alone. The center **Pause** position is not a destination — it's a distinct circular action using the approved Harmony Form mark (`BRAND_IDENTITY.md` §7) as its logo/mark-only visual control, behaving like a simple music-player action (`PRODUCT_FLOW.md` §4). It never takes the icon-plus-label tab treatment described above.
- **Sheets/modals**: reserved for focused, temporary tasks that shouldn't lose the underlying screen's context (Big Moment mode select, a confirmation dialog, Gift a Pause — Compose) — always dismissible, always returning to exactly where the user was.
- **Feedback controls**: the Better/Same/Not better and Practice Return "how did that go?" patterns share one visual language — a small set of calm, equally-weighted choices, never a star rating, numeric scale, or emoji-reaction picker, which would misrepresent the emotional nuance FOUNDATION.md asks for.
- **Progress indicators**: used sparingly — a Pause's playback progress, a Practice skill's session progress. Never a gamified progress bar with badges or level-up styling; progress is shown as quiet, factual state, not an achievement system.
- **Notification surfaces**: in-app notification/toast treatment is quiet and self-dismissing, consistent with `UX_ARCHITECTURE.md` §12's "Gentle Pause has no destination" principle — a notification is never designed to demand interaction.
- **Empty states**: always explain what will appear and why (per `UX_ARCHITECTURE.md` §13), using the same typographic hierarchy as any other screen — never an illustrated "nothing here yet" graphic that adds decoration without information.
- **Errors**: calm, specific, actionable text using the `error` role only where genuinely needed (transcription failure, permission denial) — never alarming iconography or red-saturated full-screen treatments for recoverable, low-stakes situations.

---

## 8. Pause Visual Language

This is the visual center of the product — where sound becomes visible.

- **Core form**: a single organic, waveform-derived visual that represents the sound currently playing — not a literal audio-editing waveform (bars/spectrogram), but a smoothed, continuous organic line or form whose motion is driven by the actual audio (or a closely-synced approximation), so it reads as alive rather than looping decoration.
- **Breathing motion**: independent of moment-to-moment audio response, the form carries a slow, continuous underlying rhythm (an inhale/exhale-paced expansion and contraction) so that even during quiet passages of a Pause, the visual still feels alive rather than static.
- **Sound-responsiveness**: layered on top of the breathing rhythm, subtler motion reflects the actual sound (e.g. gentle amplitude-driven shifts) — this responsiveness should be felt more than seen; it should never spike into sharp, attention-grabbing movement.
- **Environmental visualization**: the sound environment (rain, forest, ocean, bells, etc., per `PRODUCT_FLOW.md` §8) may be echoed through extremely subtle, slow-moving background texture or color temperature shift — never a literal illustrated scene (no cartoon rain, no forest illustration). The environment is suggested, not depicted.
- **Progress visualization**: integrated into the same core form rather than a separate progress bar bolted underneath it where possible — e.g. the form's overall shape or a thin encompassing arc can carry both "this is alive" and "this is how far along we are" simultaneously, keeping the player visually singular rather than a stack of separate widgets.
- **Restraint**: during playback the screen holds exactly the core visual form, sparse guide text when present, the "Why This Pause?" disclosure trigger, and playback controls — nothing else. This is `PRODUCT_FLOW.md` §7's "the player should remain visually quiet," applied as a hard constraint, not a suggestion.
- **Explicitly not**: album art, scrubbing waveform bars, a track list, visualizer presets, equalizer bars, or any other component that would make this read as a music-player clone. The Pause player has one visual subject, not a music-app's control surface.

---

## 9. Chakra / Frequency Presentation

Supporting information, never the main event, per `PRODUCT_FLOW.md` §8–9 and `FOUNDATION.md`'s explicit "not a chakra education platform."

- **Default visibility**: a small, quiet, single-line indicator (e.g. "Solar Plexus · 528 Hz") rendered in the `chakra-info` tone (§2.4) at a size and weight subordinate to any guide text, shown only occasionally during playback, roughly one to two informational moments per Pause (`PRODUCT_FLOW.md` §7's session-aware content layer, role 3), never as a persistent header or continuously visible label — never competing with the core visual form (§8) for attention.
- **On tap ("Why This Pause?")**: expands into the exact four-part explanation `PRODUCT_FLOW.md` §9 defines, Chakra, Frequency, Together, Why this helps, presented as plain, calm typography (§3), not as an illustrated or iconography-heavy "educational module." No chakra symbol iconography, no mystical imagery, text-led, honest, and brief. Never includes "modern perspective" framing, evidence disclaimers, or skepticism language (`PRODUCT_FLOW.md` §9's strict rule).
- **In Practice — Skill Introduction**: where a skill has a traditional lineage, it's shown as a small collapsed tag beneath the skill name (matching the existing product decision to use a tag component rather than a persistent visual chakra-branding system), expandable to the same honest, transparent framing.
- **Never used for**: navigation, categorization/filtering UI, color-coding across the app, or as a decorative background motif. Chakra/frequency material is information the user can seek out, never a visual system the product is dressed in.

---

## 10. Motion System

Motion should feel like a slow exhale.

- **Motion principles**: every animation reduces perceived anxiety or communicates calm; nothing animates purely for delight or brand flourish. Directly inherits `FOUNDATION.md`'s Motion Principles verbatim in spirit: gentle fades, slow easing, subtle transforms, organic movement — never bounce, flashy transitions, or movement for decoration.
- **Durations**: transitions are unhurried relative to typical app conventions — screen transitions and state changes favor slightly longer, smoother durations over snappy/instant ones, without ever feeling sluggish or blocking input. Micro-interactions (a chip selecting, a button press) stay quick enough to feel responsive; anything communicating an emotional or state shift (screen transitions, Pause completion, check-in responses) takes its time.
- **Easing**: consistently soft, ease-in-out style curves throughout — no linear motion, no elastic/spring-with-overshoot easing anywhere in the system.
- **Transitions**: screen-to-screen movement uses gentle cross-fades or soft slides rather than hard cuts or platform-default abrupt transitions — reinforcing continuity rather than treating each screen as a disconnected page.
- **State changes**: selection, completion, and toggling use soft opacity/scale shifts rather than instant snaps or attention-grabbing pulses.
- **Page transitions**: consistent direction/logic across the whole app (e.g. forward flows move one consistent way, back another) so the user always has a subconscious sense of place without needing to think about it.
- **Pause playback motion**: continuous, per §8 — the breathing rhythm never fully stops while a Pause is active, even when the sound itself is very quiet.
- **Waveform motion**: layered exactly as described in §8 — a constant slow underlying rhythm plus subtle sound-responsive variation, never sharp or reactive enough to feel jittery.
- **Feedback transitions**: Pause Check-in and Practice Return responses acknowledge the user's choice with a brief, quiet confirmation motion before advancing — never an abrupt cut to the next screen.
- **Loading**: a soft, breathing-style pulse or fade rather than a spinning wheel wherever feasible — loading should feel consistent with the rest of the app's motion language, not like a generic system control.
- **Success/completion**: a single, brief, quiet moment of acknowledgment (a gentle fade/glow, never confetti, badges, or celebratory animation) — completion is respected, not gamified, consistent with `FOUNDATION.md`'s rejection of dark patterns and artificial engagement.
- **Reduced motion**: every animation in this system has a reduced/no-motion equivalent (see §13) that preserves the state change (e.g. a fade replaces a slide) without ever losing information conveyed only through motion.

---

## 11. Sound Visualization Language

A single coherent visual grammar ties together every place sound appears, so the system reads as one product rather than a set of disconnected screens:

- **Pause types** (Right Now, Big Moments — Before/During/After, Practice) share the identical core visual form (§8) and motion language (§10) — they are differentiated only by *configuration* (which sound environment, which duration, which guide text), never by a different visual system. This mirrors `UX_ARCHITECTURE.md` §7's finding that Arrive and Pause Player are literally the same shared screen across all Pause-producing flows.
- **Natural sound environments** (rain, forest, birds, ocean, wind, bells, singing bowls, ambient textures) are represented through extremely subtle background tone/texture shifts layered behind the core form (§8), never through separate illustrated iconography per environment — a consistent restrained treatment regardless of which environment is playing.
- **Frequency/tonal layer** is represented only through the small text indicator and its expandable explanation (§9) — it has no independent visual/motion treatment of its own; it is information about the sound, not a separate visual layer.
- **Practice skills**: each of the seven skills (Confidence, Self-Trust, Uncertainty, Emotional Regulation, Letting Go, Presence, Self-Compassion) is distinguishable through typography, iconography, and its optional chakra tag (§9) — not through a unique per-skill color system, keeping the palette restrained (§2) rather than turning Practice Discovery into a rainbow grid.
- **Big Moments**: Before/During/After share the same Pause visual language but are distinguished through pacing and duration (a During Pause's core form animates through a much shorter, more immediate arc than a Before or After Pause) — motion timing itself communicates the mode, rather than a mode-specific color or icon system layered on top.
- **The result**: sound is made tangible through one consistent living form plus restrained, honest supporting text — never through decorative wallpaper, per-category color coding, or illustrated scenes.

---

## 12. Responsive Behavior

**Mobile is primary** — every principle above is designed mobile-first; larger viewports extend it, they do not redesign it.

- **Mobile**: full-width single-column layout, bottom navigation always reachable by thumb, generous touch targets (§13), content margins as defined in §4.
- **Tablet**: the same single-column reading/interaction flow, centered within the maximum content width (§4) rather than stretched — supporting content (e.g. Practice Explore's grid) may use the additional width for a slightly wider grid, never for a second independent navigation column.
- **Desktop**: content remains centered at the maximum content width; bottom navigation may relocate to a persistent side or top position at this breakpoint, but the four-destination structure and one-dominant-action-per-screen principle stay identical — desktop is not an opportunity to reintroduce density or dashboard patterns.
- **Narrow screens**: spacing scale (§4) compresses by one step before typography or touch targets are ever reduced — legibility and tap accuracy are protected first.
- **Touch**: the primary input model everywhere; every interactive element meets the minimum touch target in §13 regardless of viewport.
- **Keyboard**: full keyboard operability on any viewport where a keyboard is present (desktop, tablet with keyboard) — tab order follows visual/reading order, and the single dominant action per screen is reachable and activatable without a mouse.
- **Orientation**: the Pause player and core visual form (§8) adapt gracefully to landscape without cropping or distorting the form — landscape is treated as a supported state, not an edge case to ignore.
- **Safe areas**: all layouts respect device safe areas (notches, home indicators, rounded corners) — the bottom navigation and any full-bleed sheet/player never render content under system chrome.

---

## 13. Accessibility

- **Minimum touch targets**: no interactive element smaller than a comfortable thumb-sized target (consistent with platform accessibility guidelines, generally 44×44pt/dp or larger) — chips and secondary controls are never sized down below this floor even when visually compact.
- **Contrast**: per §2.5 — 4.5:1 body, 3:1 large text and interactive elements, in both themes.
- **Focus states**: every interactive element has a clearly visible focus indicator (distinct from hover/selected styling) for keyboard and switch-device navigation — never removed for aesthetic reasons.
- **Keyboard navigation**: full operability per §12; no interactive flow (including the Pause player's controls and Tell Inner Pause's Write/Speak toggle) is mouse/touch-only.
- **Screen readers**: every icon-only control (mic, play/pause, nav icons) carries a text label for assistive technology; the core visual form (§8) is marked decorative to screen readers, with playback state and progress exposed through accessible text/controls instead.
- **Reduced motion**: honors the system-level reduced-motion preference — breathing motion, page transitions, and loading states all switch to their static/fade-only equivalents (§10) with no loss of information.
- **Audio controls**: play/pause/restart/exit are always available as explicit controls, never gesture-only — and volume/mute is always reachable without leaving the Pause player.
- **Text scaling**: layouts tolerate at least one to two steps of system-level text-size increase without truncating or overlapping content — typography (§3) uses relative, not fixed-pixel, sizing.
- **Non-color-only states**: every state that uses color (selected, error, success, active tab) pairs it with a second signal — shape, icon, weight, or text — per §2.5 and §6.

---

## 14. Content / Copy Rules

- **Human**: written the way a thoughtful person would speak, not the way a product spec would phrase it.
- **Concise**: says the minimum needed to be understood — trimmed until nothing further can be removed without losing meaning.
- **Calm**: never urgent, never exclamatory, never trying to create emotion the user doesn't already have.
- **Direct**: says exactly what will happen when a control is used — no vague or clever labels where a plain one would do.
- **Non-clinical unless necessary**: everyday language by default (matching `FOUNDATION.md`'s "immediate relief" examples — "I can't sleep," "I feel overwhelmed"); clinical/technical terms are used only where genuinely required (e.g. accessibility or privacy disclosures), never to sound more authoritative.
- **Clean sentence construction**: periods, commas, colons, and line breaks carry the structure of a sentence. Centered dots are used only as compact UI separators (e.g. "Root Chakra · 396 Hz"). Em dashes, en dashes, and dash-based parenthetical or stylistic constructions are never used in user-facing copy. Good: "Root Chakra · 396 Hz." "Traditionally associated with grounding, steadiness and belonging." "Take a moment to settle." Not: "Root Chakra — 396 Hz." "Grounding — a traditional association." "Take a moment — there is nothing you need to solve." This applies across every surface: Pause, Practice, Moments, Tell, Journey, You, notifications, Entry, and future marketing copy. It governs user-facing strings specifically, not this document's own analytical prose.

**Avoid**:
- Exaggerated wellness claims ("transform your life," "unlock your best self").
- Toxic positivity (never insisting the user should feel good, or that "everything happens for a reason").
- Unnecessary motivational language (no cheerleading copy attached to routine actions).
- Jargon (chakra/frequency terms are explained plainly when shown, per §9, never assumed as common knowledge).
- Guilt (a skipped check-in, a lapsed streak, or a declined notification permission is never framed as a failure).
- Pressure (no artificial urgency, no countdowns, no "don't miss out" phrasing anywhere, including Pass messaging — matching `UX_ARCHITECTURE.md` §11's explicit no-pressure principles).
- A generic quote feed (`PRODUCT_FLOW.md` §7's session-aware content layer is sparse and context-selected, never an endless scrolling or motivational-feed surface).

---

## 15. Design Laws

- One primary action per screen.
- Remove before adding.
- Visual hierarchy before decoration.
- Whitespace is a feature, not empty space to fill.
- Never make users read to understand what to do.
- Color communicates, it never decorates.
- Motion should communicate calm — never bounce, never rush.
- The UI should disappear behind the experience.
- Every element must earn its place.
- One typeface, two weights, three heading levels — complexity is a decision, not a default.
- No nested containers beyond background → surface → surface-raised.
- Chakra and frequency information supports the Pause; it never becomes the Pause.
- The player is the quietest, most important screen in the product — protect it above all else.
- If a screen needs a fourth thing to explain itself, something upstream has already failed.
- When unsure, choose the calmer option.

---

## Reporting

**1. Exact file path:** `docs/DESIGN_SYSTEM.md`

**2. Main visual decisions:**
- Light-first, warm-neutral palette (not clinical white, not cool greys) with a single restrained accent pair; dark theme fully redesigned per-role, not inverted.
- One typeface, two weights, three heading levels, tabular figures reserved for numeric/progress data only.
- Maximum three surface-elevation levels (background/surface/surface-raised), hairline borders only where a background shift alone isn't legible, minimal soft shadows for genuine elevation only.
- One shared organic waveform-derived visual (not literal audio bars) used identically across every Pause type — breathing motion always present, sound-responsiveness layered subtly on top, progress folded into the same form rather than a separate bar.
- Chakra/frequency treated strictly as supporting text information in one consistent restrained tone — explicitly no per-chakra color-coding system anywhere in the app.
- Motion system built entirely around "slow exhale": soft easing only, no bounce/spring, continuous breathing rhythm during playback, quiet non-gamified completion moments.
- Component set deliberately small: three button emphasis levels, one card pattern, one input pattern (text+voice as equal peers), one selector pattern for all short-choice moments (mode select, Better/Same/Not better).

**3. Unresolved design decisions requiring founder input:**
- **Exact color values.** This document defines roles and warm/muted direction (e.g. "violet-to-plum or deep amber family" for accent-primary) but deliberately does not lock final hex values — that's a token-level decision best made alongside real screens/contrast testing, not asserted abstractly here.
- **Primary typeface selection.** The strategy (single humanist sans, two weights) is defined; the actual font family (licensed vs. system vs. variable font) is an open selection, likely tied to performance/licensing constraints not yet evaluated.
- **Exact motion durations/easing curve values.** Direction ("slow exhale," ease-in-out, no bounce) is locked; precise millisecond/curve values are an implementation-tuning decision best made against the real waveform-as-face build.

Stopping here for review.

