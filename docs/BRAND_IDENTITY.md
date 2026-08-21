# INNER PAUSE — BRAND IDENTITY v1.0

> Canonical source of truth for the Inner Pause visual identity: logo, color, typography, and brand motion language.
>
> Locked direction: **Concept 3 — The Harmony Form.** This document specifies the approved reference exactly — it does not redesign it, simplify it, or substitute a different mark.
>
> Relationship to other documents: `docs/FOUNDATION.md` governs product philosophy (unchanged, not touched here). `docs/PRODUCT_FLOW.md` and `docs/UX_ARCHITECTURE.md` govern product behaviour and structure (unchanged, not touched here). `docs/DESIGN_SYSTEM.md` governs structural/interaction principles — spacing, shape, elevation, component principles, motion *timing categories*. Where `DESIGN_SYSTEM.md` previously left exact color values and the primary typeface as explicitly **provisional** ("intentionally not fully locked yet"), **this document now supersedes those placeholders** with the locked brand system below. `DESIGN_SYSTEM.md`'s structural guidance remains in force and is not contradicted by anything here.
>
> Nothing in this document has been wired into the running application. No UI has been implemented or redesigned as part of this step.

---

## 0. Status

> **Founder visual approval: Harmony Form identity locked.**

The founder has visually reviewed the actual generated assets (via the local brand proof page) and approved the identity as final. As of this approval:

- The Harmony Form concept, its meaning, the brand line, and the approved visual direction (§1) are **locked** — not to be redesigned, reinterpreted, simplified, or replaced.
- The full set of generated SVG masters and raster exports listed in §11 are the **approved implementation masters** — the actual files to build against, not placeholders or proofs-of-concept.
- Any future change to the mark, wordmark, color values, or logo construction rules in this document requires a new, explicit approval — it is not open for incremental reinterpretation during implementation.

---

## 1. Brand Story

Life is full of noise — thoughts, emotions, pressure, expectations. We get pulled outward and lose our center.

Inner Pause is built on a simple belief: **when we pause, we return to harmony.**

Inner Pause creates a gentle space between the noise and our response — a space where we can hear ourselves again.

The logo is a visual story of that journey:

- The two vertical bars are the universal symbol for Pause — an invitation to stop.
- Around them, layers of resonating waves expand and intersect — sound in motion, thoughts settling, emotions integrating.
- At the center is stillness.

**Inner Pause helps people return there.**

### Brand essence

> Sound meets stillness.
> Pause creates harmony.
> You come home to yourself.

### Core brand line

> **Pause the noise. Return to you.**

### Brand descriptors

Harmony · Resonance · Flow

### Brand feel

Calm · Modern · Trustworthy · Mindful · Grounded · Clear · Warm · Premium · Human

---

## 2. Logo

### 2.1 System overview

| Asset | File | Use |
|---|---|---|
| Primary logo (lockup) | `public/branding/innerpause-logo.svg` | Mark + wordmark + tagline, light backgrounds. Splash screens, marketing, headers where full brand presence is appropriate. |
| Primary logo, dark | `public/branding/innerpause-logo-dark.svg` | Same lockup, for dark backgrounds. |
| Standalone mark | `public/branding/innerpause-mark.svg` | The Harmony Form alone, light backgrounds. Compact brand presence — nav headers, loading states, watermarks. |
| Standalone mark, dark | `public/branding/innerpause-mark-dark.svg` | Same mark, for dark backgrounds. |
| Wordmark only | `public/branding/innerpause-wordmark.svg` | "INNER PAUSE" text only, no mark, navy fill (`#1D1B4C`) — light backgrounds. |
| Wordmark only, dark | `public/branding/innerpause-wordmark-dark.svg` | Same wordmark, identical geometry/font/tracking, cream fill (`#F8FAFC`) — dark backgrounds. Resolves the "no dedicated dark wordmark" gap noted during the brand-proof review; the proof page's CSS-invert workaround is no longer necessary. |
| Monochrome mark | `public/branding/innerpause-monochrome.svg` | Single-tone (brand navy) version for light backgrounds — printing, stamping, low-color contexts, watermarks. |
| Monochrome mark, dark | `public/branding/innerpause-monochrome-dark.svg` | Single-tone (cream/white) version for dark backgrounds. |
| App icon | `public/branding/innerpause-icon.svg` (+ `innerpause-icon-512.png`) | Full-bleed rounded-square app icon, navy background, light mark. |
| Maskable app icon | `public/branding/innerpause-icon-maskable.svg` | Android adaptive icon — mark kept within the ~66% center safe zone so OS-applied shape masks never clip it. |
| Center Pause action | `public/branding/innerpause-pause-action.svg` | The standalone mark applied to the bottom-nav center action (§6). Not an app icon; a nav control. |
| Favicon | `public/branding/favicon.svg` (+ PNGs in `public/branding/pwa/`) | Simplified two-ring version, legible at 16–48px. |
| PWA/app icon PNGs | `public/branding/pwa/icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `apple-touch-icon-180.png`, `favicon-16.png`, `favicon-32.png`, `favicon-48.png` | Raster exports for manifest/meta-tag wiring, generated directly from the SVG masters above (not redrawn). |

None of these files replace or overwrite the currently-live assets in `public/branding/` (`innerpause-icon.png`, `innerpause-logo.png`, `innerpause-logo-small.png`) or `public/icons/`. They are new, additive deliverables awaiting a future implementation step.

### 2.2 Light vs. dark vs. monochrome — when to use which

- **Full-color, light background** (`innerpause-mark.svg` / `innerpause-logo.svg` / `innerpause-wordmark.svg`): the default. Use on the warm background, white surfaces, or any light neutral.
- **Full-color, dark background** (`innerpause-mark-dark.svg` / `innerpause-logo-dark.svg` / `innerpause-wordmark-dark.svg`): use on brand navy or any dark surface (§7). Ring colors shift toward the lighter end of the violet ramp; bars and wordmark fill become cream/white for contrast.
- **Monochrome**: use only where color reproduction is unavailable or inappropriate — single-color print, embossing, watermarks behind content, disabled/inactive states. Never use monochrome as a stylistic choice on a normal color screen.

---

## 3. Logo Meaning

| Element | Meaning |
|---|---|
| Layered waves (the overlapping rings) | Sound, thought, and emotion in motion — the layers within us. Not a single clean signal, but many things happening at once. |
| Two vertical bars | Pause. The universal symbol, unmistakable at any size — an invitation to stop. |
| The central space between and around the bars | Stillness. The quiet that becomes visible once the bars interrupt the motion around them. |
| The overall form, waves settling around a still center | Returning to oneself. The whole mark is the brand promise in one image: noise organizes itself around a point of calm. |

The mark is never purely decorative — every element traces back to this meaning. Nothing should be added to it (extra rings, mascots, badges, drop shadows as a default treatment) that doesn't serve this story.

---

## 4. Color System

### 4.1 Locked palette (source values)

**Primary**

| Role | Hex |
|---|---|
| Brand navy | `#1D1B4C` |
| Primary violet | `#4338CA` |
| Secondary violet | `#7C6AED` |
| Soft violet | `#C4B5FD` |

**Neutrals**

| Role | Hex |
|---|---|
| Neutral 900 | `#0F172A` |
| Neutral 700 | `#334155` |
| Neutral 500 | `#64748B` |
| Neutral 300 | `#CBD5E1` |
| Neutral 50 | `#F8FAFC` |

**Warm surface (brand-owned, not an incidental choice)**

| Role | Hex |
|---|---|
| Warm background | `#FAF7F2` |

This is not an arbitrary off-white. It's the intentional, warm-shifted counterpart to Neutral 50 (`#F8FAFC`) — Neutral 50 is a *cool* near-white (used for structural neutral contexts, e.g. dark-mode text-on-dark); Warm Background is deliberately warmed for the actual living surface the product is used on. It is the base of the Home direction already in development and is now formally part of the brand system, not a separate decision. Continuity with the value already in use (`--ds-bg: #faf7f2` in `app/globals.css`) is intentional.

### 4.2 Role system

| Token role | Value | Source |
|---|---|---|
| Brand navy | `#1D1B4C` | Primary |
| Primary violet | `#4338CA` | Primary |
| Secondary violet | `#7C6AED` | Primary |
| Soft violet | `#C4B5FD` | Primary |
| Primary text | `#0F172A` | Neutral 900 |
| Secondary text | `#334155` | Neutral 700 |
| Muted text | `#64748B` | Neutral 500 |
| Border | `#CBD5E1` | Neutral 300 |
| Light surface | `#FFFFFF` | White (cards/raised elements on light) |
| Warm background | `#FAF7F2` | Warm surface — the living background of the product |
| Dark background | `#1D1B4C` | Brand navy, used directly as the dark-mode base |
| Dark surface | `#262357` | Brand navy, lightened ~12% — raised elements in dark mode read as *lighter* than the background, matching `DESIGN_SYSTEM.md` §2.3's elevation model |

**Why primary text is Neutral 900, not brand navy**: brand navy (`#1D1B4C`) is a *saturated, colorful* dark tone — excellent for the logo and as a deliberate accent, but using it as the default body-text color would tint every screen faintly violet and blur the line between "brand color" and "neutral ink." Neutral 900 (`#0F172A`) is the true structural ink; brand navy is reserved for the identity itself and for deliberate accent use (§7).

### 4.3 Accessibility

- Primary text (`#0F172A`) on warm background (`#FAF7F2`) or light surface (`#FFFFFF`): well over 15:1 — passes AAA.
- Secondary text (`#334155`) on warm background: comfortably passes AA (≈9:1) for any text size.
- Muted text (`#64748B`) on warm background: measures **≈4.5:1** — right at the AA floor for normal text. Treat this as a floor, not a default: fine for 14px-medium-and-above supporting text (captions, timestamps, secondary labels), but prefer secondary text (`#334155`) for anything smaller or thinner. Do not introduce a lighter "extra-muted" tone below this.
- Primary violet (`#4338CA`) and secondary violet (`#7C6AED`) both clear 3:1 against warm background and white — safe for icons, focus rings, and other non-text UI components at their locked values.
- Soft violet (`#C4B5FD`) is **not** an accessible foreground color against warm background or white — it is a tint/wash color only (backgrounds, decorative ring layers, disabled fills), never text, never a small icon on its own.
- On dark background (`#1D1B4C`): use Neutral 50 (`#F8FAFC`) as primary text (contrast ≈14:1), soft violet (`#C4B5FD`) for secondary text/icons (contrast ≈7:1), and avoid primary violet as dark-mode body text (too close in value to the background family).

### 4.4 Contextual tints — derived, not arbitrary

The Home direction's six Right Now outcomes need gentle differentiation without turning Home into a multi-color grid (`DESIGN_SYSTEM.md` §2.4, §11 already establish this restraint). Four tint families, each calibrated to the same lightness/chroma character as the primary violets rather than picked as arbitrary pastels:

| Tint family | Core tone | Soft background wash | Dark-mode tone | Used for |
|---|---|---|---|---|
| Violet-derived | Secondary violet `#7C6AED` | Soft violet `#C4B5FD` at low opacity over warm background | `#A692EA` | Sleep, Calm |
| Muted green-derived | `#6B9080` | `#E3ECE7` | `#8FB5A3` | Reset, Release |
| Warm gold/peach-derived | `#C98A4B` | `#F6E9D9` | `#E0A868` | Focus |
| Soft rose-derived | `#B4587A` | `#F8E6EC` | `#D47B9C` | Confidence |

The violet family reuses the brand's own primary colors directly — no invention needed. The green, gold, and rose families are new but deliberately harmonized: same mid-range lightness and moderate saturation as primary/secondary violet, so next to each other they read as one restrained family, not six unrelated hues. **Usage rule, carried over from `DESIGN_SYSTEM.md` §11**: these tints color small elements only — an icon glyph, a thin accent line — never a tile's full background. Home does not become a colored grid.

---

## 5. Typography

**Inter** is the approved typeface. It is already available via `next/font/google` — the exact loading mechanism already used for the project's current interim typeface (Geist) — so there is no technical or licensing barrier to adopting it. (Not switched in code as part of this step — see §10.)

| Level | Weight | Size | Tracking | Line-height | Use |
|---|---|---|---|---|---|
| Display | 800 (Extra Bold) | 2.5–3rem | −0.02em | 1.1 | Brand moments only — splash, marketing, the primary logo lockup's wordmark. Not app UI chrome. |
| H1 | 700 (Bold) | 1.75rem | −0.01em | 1.2 | One per screen — the screen-defining headline (`DESIGN_SYSTEM.md` §3). |
| H2 | 600 (Semibold) | 1.25rem | −0.005em | 1.25 | Section headers within a screen. |
| H3 | 600 (Semibold) | 1.05rem | 0em | 1.3 | Card/item titles. |
| Body | 400 (Regular) | 1rem | 0em | 1.6 | Primary reading content. |
| Body, secondary | 400 (Regular) | 0.875rem | 0em | 1.55 | Supporting copy. |
| Labels | 500 (Medium) | 0.8125rem | 0.02em | 1.2 | Button/tab/control labels — often uppercase for tab labels, sentence case for buttons. |
| Captions | 500 (Medium) | 0.75rem | 0.01em | 1.4 | Timestamps, micro-labels, metadata. Muted-text color only. |
| Numeric/progress | 600 (Semibold), tabular figures (`font-variant-numeric: tabular-nums`) | Context-dependent | 0em | 1.1 | Session counts, durations, streak numbers, Pass-expiry countdowns — Inter's built-in tabular-figure support keeps digits from shifting width as they change (`DESIGN_SYSTEM.md` §3.6). |

**Weight discipline**: five weights appear above (400/500/600/700/800), which is more than `DESIGN_SYSTEM.md`'s original "two weights" placeholder — refined now that the exact typeface is locked. In practice, most screens use only three: 400 (body), 500 (labels/captions), 600 (headings/emphasis). 700 and 800 are reserved for H1 and Display respectively — not used interchangeably with 600. No weight below 400 (thin/light) and none above 800 (black) — both undermine legibility and the "warm, human" brand feel.

**Tracking discipline**: negative tracking only at large display sizes (where default spacing looks loose); positive tracking only for small uppercase labels (where it aids legibility); body text uses default (0) tracking always.

---

## 6. Logo Construction

### 6.1 Geometry

The mark is built on a 240×240 unit grid, center at (120, 120).

**Rings** — four overlapping circles, each offset slightly from center rather than perfectly concentric (concentric rings would read as a target/mechanical radar symbol; the offset produces the organic, resonant "layers" feeling the concept calls for):

| Ring | Center | Radius | Stroke width | Color (light bg) | Opacity |
|---|---|---|---|---|---|
| Outermost | (106, 112) | 86 | 3 | Soft violet `#C4B5FD` | 0.55 |
| Second | (134, 110) | 84 | 3.5 | Secondary violet `#7C6AED` | 0.7 |
| Third | (112, 134) | 82 | 4 | Primary violet `#4338CA` | 0.85 |
| Innermost | (128, 128) | 80 | 4.5 | Brand navy `#1D1B4C` | 0.95 |

On dark backgrounds the same four rings shift to (outer→inner) primary violet, secondary violet, soft violet, Neutral 50 — see `innerpause-mark-dark.svg`.

**Pause bars** — two vertical rounded rectangles, always centered exactly on the grid center regardless of the rings' asymmetry, drawn last (topmost layer) so they always read clearly:

| Bar | x | y | Width | Height | Corner radius |
|---|---|---|---|---|---|
| Left | 94 | 82 | 18 | 76 | 9 |
| Right | 128 | 82 | 18 | 76 | 9 |

Gap between bars: 16 units. Bar height : mark diameter ≈ 0.32 — the bars are unmistakably the dominant, central element, exactly as specified ("visually dominant").

### 6.2 Proportions and relationship

Ring diameter : bar height ≈ 2.1 : 1. The rings never shrink so far that they crowd the bars, and never grow so far that the bars read as a small detail — this ratio is what keeps the bars "clearly recognizable at small sizes" (verified down to the 16px favicon, §6.4).

### 6.3 Clear space

Minimum clear space around the mark on all sides = the width of one pause bar (18 units at native scale, i.e. ~7.5% of the mark's bounding box). No text, edge, or other graphic element should intrude inside that margin.

### 6.4 Minimum size

- Full mark (four rings + bars): 24px minimum for on-screen use. Below that, ring layering starts to visually merge.
- Favicon-simplified version (two rings + bars, `favicon.svg`): legible down to 16px — this is why a separate, simplified favicon source exists rather than shrinking the four-ring mark.

### 6.5 Aspect ratio

The standalone mark is always 1:1 (square). The primary logo lockup (mark + wordmark + tagline) uses a fixed proportion, defined in `innerpause-logo.svg`'s viewBox (400×460) — do not stretch either axis independently.

### 6.6 Approved lockups

1. Mark alone (`innerpause-mark.svg` / dark variant)
2. Mark + wordmark, stacked, tagline below (`innerpause-logo.svg` / dark variant) — the primary lockup
3. Wordmark alone (`innerpause-wordmark.svg`) — only where the mark already appears elsewhere on the same screen (e.g. as the center Pause action) and repeating it would be redundant
4. Monochrome mark (single-color contexts)
5. App icon badge (mark + navy rounded-square background)
6. Center Pause action badge (mark + circular violet-gradient background)

### 6.7 Incorrect usage

- Do not recolor the rings outside the locked palette (§4.1).
- Do not make the rings perfectly concentric (mechanical, not organic).
- Do not rotate, skew, or mirror the mark.
- Do not add a drop shadow, bevel, or outer glow as a default treatment (motion/elevation effects belong to interaction states, §8 — not the static logo).
- Do not place the full-color mark on a background that isn't warm background, white, or brand navy without checking contrast first.
- Do not shrink the four-ring mark below 24px — use the favicon-simplified version instead.
- Do not stretch, squash, or crop the mark.
- Do not add a mascot face, additional icon, or badge overlay to the mark.

---

## 7. Center Pause Action

The center bottom-nav action (`PRODUCT_FLOW.md` §4) uses `innerpause-pause-action.svg` — the standalone mark applied to a circular, filled badge:

- **Shape**: full circle, not the app-icon's rounded square — visually distinct from the app icon and from any destination tab icon.
- **Fill**: a subtle radial gradient between two violet tones (`#5546D6` → `#3B2FA8`, both mixed from primary/secondary violet) rather than a flat fill — "feels like a breath between everything," per the approved direction, without introducing a new palette color.
- **Mark treatment**: the dark-background ring/bar treatment (light rings, cream bars) for contrast against the violet fill.
- **Behavior**: circular, distinct from the four destination nav items, icon/mark only — no text label, no badge/counter overlay. Calm at rest, clearly tappable (elevated slightly above the nav bar plane, per `DESIGN_SYSTEM.md` §6's primary-CTA emphasis conventions — exact elevation/shadow value is an implementation detail, not fixed here).
- **Not the app's brand logo by itself**: this is an *application* of the standalone mark to a navigation control, not a second logo. The primary logo (§2) remains the identity; this is one deliberate, approved use of it.
- **Fallback**: if the mark cannot render (asset load failure), fall back to a plain two-bar pause glyph in the same circular badge — never a generic play/media-icon substitute, and never blank.

---

## 8. Home Color Validation

The brand system exists to *support* the Home direction already in development, not to overpower it. Explicit guidance per surface:

### Home
- Base: warm background (`#FAF7F2`) — unchanged from the current direction.
- Text: primary text (`#0F172A`) for headings and outcome labels, secondary/muted per `DESIGN_SYSTEM.md` §2.5's existing hierarchy.
- Accent: primary violet (`#4338CA`) used sparingly — the six Right Now icon glyphs' base tone family (§4.4), focus rings, the single primary CTA per screen. **Never** a tile or card *background* wash.
- The Moments doorway and Tell Inner Pause hero use borders/surface distinction (light surface `#FFFFFF` on warm background, per `DESIGN_SYSTEM.md` §5), not color blocking.
- **Do not** apply brand navy or primary violet as a large background field anywhere on Home. The brand is expressed through the mark, the accent color's restrained use, and the contextual tints (§4.4) — not through purple-washed surfaces. This is the direct answer to "do not make Home look like a purple marketing website."

### Pause Player
- This is where the mark's *motion* language (§9) has the most room to appear — the breathing rings are a natural fit for the playback visual, more so than anywhere else in the product.
- Background can shift subtly toward brand navy during playback (an immersive, focused moment is the one place a deeper brand-color environment is earned) — but this is a future design decision, not specified further here, and must still pass `DESIGN_SYSTEM.md` §8's "visually quiet" requirement for the player.

### Practice
- Same restrained rule as Home: warm/light surfaces, brand navy/violet reserved for accents and the traditional-inspiration tag treatment already defined in `DESIGN_SYSTEM.md` §9.

### Journey
- Neutral-forward (this is a reading/reflection surface) — primary/secondary text carry almost all the visual weight; violet appears only in interactive affordances (correcting a Pattern, opening a Moment).

### You
- Utility surface — light surface and border tokens dominate; brand color appears only where genuinely branded (e.g. the Inner Pause Pass screen may reasonably use more brand presence than a plain settings row).

### Dark mode
- Background: brand navy (`#1D1B4C`) directly — dark mode literally lives inside the brand color, which is a meaningful, non-arbitrary choice rather than a generic near-black.
- Surface: `#262357` (navy, lightened) for raised cards/sheets.
- Text: Neutral 50 primary, soft violet secondary (§4.3).
- The warm background token does not apply in dark mode — it's a light-mode-only concept, matching `DESIGN_SYSTEM.md` §2.3's separately-designed dark palette.

### Center Pause action
- Covered in full in §7 — the one place a saturated violet fill is not only acceptable but the approved, intended treatment.

---

## 9. Motion / Visual Language

The Harmony Form is not static brand furniture — it's the seed of the product's whole motion language (`DESIGN_SYSTEM.md` §10's "slow exhale" principle, extended here to the mark specifically). Direction only — **not implemented in this step.**

- **At rest** (mark used as a static logo — app headers, splash): no motion, or at most an extremely slow, barely-perceptible ring drift (matching `DESIGN_SYSTEM.md`'s existing `.ds-breathe` ambient treatment) — never required, never distracting.
- **Breathing**: the rings' natural resting state during any "alive" context (loading, the center Pause action idle state) is a slow, continuous expand/contract — same rhythm class as `DESIGN_SYSTEM.md` §8's Pause-player breathing motion, so the logo and the player feel like one visual system, not two.
- **Gentle expansion on interaction**: tapping the center Pause action produces a brief, soft outward ripple from the rings (not a bounce, not a scale-and-snap-back) — acknowledging the tap the same restrained way `DESIGN_SYSTEM.md` §6 already treats selection/completion states.
- **Settling**: as a Pause session progresses toward completion, the rings' relative offsets can slowly converge — visually re-enacting the brand story ("noise organizes itself around a point of calm") over the course of the session, mirroring `WaveformFace`'s existing tense→calm progress storytelling (`docs/TECHNICAL_ARCHITECTURE.md` §1) but through the brand mark's own language instead of a waveform.
- **Subtle audio response**: where the mark appears during active playback, ring opacity/scale may respond *very* subtly to amplitude — an echo of `DESIGN_SYSTEM.md` §8's "sound-responsiveness... felt more than seen," never a literal audio visualizer.
- **Converging toward stillness**: on natural completion, rings can ease toward a calmer, less offset arrangement and then hold — the mark's own version of `DESIGN_SYSTEM.md` §10's "quiet, non-gamified completion moment."

**Hard constraints, carried directly from `DESIGN_SYSTEM.md` §10**: no bounce, no elastic/spring overshoot, no flashy transitions, no aggressive scaling, no gamified effects (confetti, badges, celebratory motion). Every motion use of the mark should feel like a slow exhale, exactly like every other animation in the product — the logo does not get a louder, more "brand-y" motion treatment than the rest of the UI.

---

## 10. Brand Implementation Rules

- **Logo usage**: use the correct pre-built asset for the context (§2.1) rather than recoloring or re-scaling a single master file ad hoc. If a needed variant doesn't exist, it should be added to this system deliberately, not improvised inline.
- **Color usage**: brand navy and primary violet are accents and identity colors, not background fields (§8). Soft violet and the contextual tints (§4.4) are wash/tint colors, never text.
- **Typography usage**: Inter only, at the defined scale (§5) — no second typeface introduced for "variety."
- **Accessibility**: respect §4.3's contrast floors exactly, especially muted text's borderline 4.5:1 — treat it as a constraint, not a suggestion.
- **Light/dark usage**: always pair the correct mark variant with its intended background (§2.2) — never place the light-background mark on brand navy or vice versa.
- **App icon usage**: `innerpause-icon.svg` for standard contexts, `innerpause-icon-maskable.svg` specifically for Android adaptive icon slots — they are not interchangeable, the maskable version's extra padding exists for a functional reason (§2.1).
- **Center Pause usage**: exactly as specified in §7 — one circular badge, one gradient, no text, no alternate colorways introduced later without updating this document first.
- **Notifications**: where a small brand mark is needed (e.g. a notification icon), use the monochrome mark (§2.2) at the platform's required size — never the full four-ring color mark at very small sizes where it won't read clearly.
- **Social assets**: not designed in this step. When needed, derive from the primary logo lockup (§6.6, item 2) rather than the standalone mark alone, so brand recognition doesn't depend on the viewer already knowing the mark.
- **Future marketing usage**: the brand story (§1) and essence lines are approved for direct reuse in marketing copy verbatim. Do not rephrase "Pause the noise. Return to you." — it is the locked core line.

---

## 11. Assets Reference — approved implementation masters

Founder-approved (§0). These are the actual files to build against — not placeholders, not proofs-of-concept. Do not delete or replace any of them without a new explicit approval. All paths relative to the repository root.

```
public/branding/
├── innerpause-logo.svg              — primary lockup, light background
├── innerpause-logo-dark.svg         — primary lockup, dark background
├── innerpause-mark.svg              — standalone mark, light background
├── innerpause-mark-dark.svg         — standalone mark, dark background
├── innerpause-wordmark.svg          — wordmark only, light background (navy fill)
├── innerpause-wordmark-dark.svg     — wordmark only, dark background (cream fill) — added post-approval, same design
├── innerpause-monochrome.svg        — single-tone mark, light background
├── innerpause-monochrome-dark.svg   — single-tone mark, dark background
├── innerpause-icon.svg              — app icon (navy rounded-square badge)
├── innerpause-icon-maskable.svg     — Android adaptive icon variant
├── innerpause-icon-512.png          — rasterized app icon, 512×512
├── innerpause-pause-action.svg      — center bottom-nav Pause action badge
├── favicon.svg                      — simplified mark for tiny sizes
├── brand-proof.html                 — local visual-approval proof page (temporary; not an application asset)
└── pwa/
    ├── icon-192.png
    ├── icon-512.png
    ├── icon-maskable-512.png
    ├── apple-touch-icon-180.png
    ├── favicon-16.png
    ├── favicon-32.png
    └── favicon-48.png
```

All PNGs were rasterized directly from the SVG masters above (via `sharp`/`librsvg`), not redrawn or separately sourced — the SVGs remain the single source of truth.
