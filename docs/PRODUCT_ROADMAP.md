# Inner Pause — Product & UI Roadmap v1

> Derived from `docs/FOUNDATION.md`'s State → Intervention → Reflection → Behaviour → Habit loop, informed by Headspace and Bend reference screenshots. This roadmap is the working plan for the ground-up redesign — it will evolve as execution surfaces new decisions, the same way FOUNDATION.md is expected to evolve.

> **Superseded, historical document.** `docs/PRODUCT_FLOW.md` is now canonical. This document predates and conflicts with it on the following points — treat it as historical on these specifically, not authoritative:
> - **Practice skill count**: this document says 10 skills (§1, §2, and the §4 table). Canonical is **7**: Confidence, Self-Trust, Uncertainty, Emotional Regulation, Letting Go, Presence, Self-Compassion. The §4 chakra-mapping table's rows for Resilience, Emotional Recovery, and Focus-as-a-10th-skill no longer apply as written.
> - **Right Now / Quick Fix categories**: this document lists 5 (§2, §3). Canonical is **6** — adds **Release**.
> - **Notifications / Reminders**: §7's "Reminders" (user-configured schedule via the browser Notification API) is superseded by `PRODUCT_FLOW.md` §31's deterministic, non-user-configured model (Practice, Return to Me, Calendar, Journey, Gentle Pause categories).
>
> Everything else here (visual system, session visual, streak philosophy, local-first constraints in §9) has not been re-evaluated against `PRODUCT_FLOW.md` and stands unless/until re-approved.

---

## 1. Navigation

Four tabs — the same shape as the prior Design 6 redesign, but the behavior inside each tab is rebuilt from FOUNDATION's principles rather than carried over:

- **Home** — state capture + intervention, collapsed into one tap
- **Practice** — the 10-skill long-term growth paths
- **Journey** — reflection history + behaviour stats
- **You** — profile, settings, habit anchor

## 2. Short-Term vs. Long-Term: Quick Fix and Journeys

FOUNDATION.md draws an explicit line between **Immediate Relief** ("I can't sleep," "I need confidence," "I feel overwhelmed") and **Long-Term Growth** (practicing named skills until they become habits). The IA keeps these as two deliberately separate systems rather than one blended list:

- **Quick Fix (short-term)** lives on **Home**: Sleep / Reset / Focus / Confidence / Calm. No commitment, no multi-day structure, no prerequisite. Reach relief in one tap.
- **Journeys (long-term)** live on **Practice**: the 10 named skills, each a multi-session structured path with progress, locking, and a connected-day timeline.

These lists are not required to match. Tapping "Sleep" as a Quick Fix does not enroll you in the "Rest & Sleep" journey; starting the "Confidence" journey does not require ever using the Confidence Quick Fix. **Journey** (the tab) reflects behaviour from *both* systems combined — it's the one place short-term relief and long-term practice show up together, as a single record of what you actually did.

## 3. Home — merged check-in + intervention

Header: "How are you feeling right now?" over the 5 Quick Fix category tiles. One tap both logs a lightweight state entry and opens that intervention directly — no separate check-in screen, no browsing step in between. Curated rows ("Continue your practice," "Picked for you") appear below the tiles, ahead of any full browse grid, per the Headspace/Bend pattern of guiding rather than requiring exploration.

## 4. Practice — all 10 skills, honestly chakra-tagged

| Skill/Path | Chakra | Traditional basis |
|---|---|---|
| Confidence | Solar Plexus | will, personal power |
| Emotional Regulation | Solar Plexus | self-control/willpower |
| Uncertainty | Third Eye | insight, intuition |
| Focus *(new path)* | Third Eye | clarity of attention |
| Letting Go | Heart | compassion, connection |
| Self Compassion | Heart | "I meet myself with kindness" |
| Self Trust | Root | grounding, safety |
| Resilience | Root | stability under stress |
| Emotional Recovery | Sacral | existing "emotionally-lighter" mood already lives here |
| Presence | Crown | data already says "presence, spaciousness and peace" |
| Creative Flow *(existing, non-FOUNDATION)* | Sacral | flow, feeling, creativity |
| Find Your Voice *(existing, non-FOUNDATION)* | Throat | expression, honesty |
| Rest & Sleep *(existing, non-FOUNDATION)* | Crown | peace, spaciousness |

Chakra tag UI: collapsed "Traditional inspiration: [Chakra]" beneath the skill name, expandable to one honest line distinguishing tradition from modern interpretation. Shown only where a real association exists — never forced.

## 5. Visual system

- **Theme**: system-preference only in v1, no manual toggle.
- **Light** — bg `#FAF6F0`, glass `rgba(255,252,247,0.7)`, border `#E8DFD3`, ink `#2B2420`, body `#5C5248`, muted `#8A7F72`, violet accent `#6C3EF4`, gold accent `#B8933E`. Category colors (desaturated): Sleep `#5B6B9E`, Reset `#4F9B8C`, Focus `#C98A4B`, Confidence `#B4587A`, Calm `#8577C9`.
- **Dark** (matches the actual brand logo) — bg `#0E0B14`, glass `rgba(40,28,58,0.55)`, border `rgba(201,162,39,0.18)`, ink `#F3EDE3`, body `#C9BFB2`, muted `#8F8579`, gold accent (primary) `#D4AF5A`, violet accent (secondary) `#9B7FE8`. Category colors (brightened for contrast): Sleep `#7C8CC4`, Reset `#6BC0B0`, Focus `#E0A868`, Confidence `#D47B9C`, Calm `#A79AE8`.
- **Motion**: gentle fades, slow easing, no bounce, in both themes.

Rationale: the app's real logo (`public/branding/innerpause-icon.png`) is near-black with a violet lotus and gold linework — a "premium, timeless" palette already invested in but abandoned by the prior light-lavender redesign. Light mode handles daytime Quick Fix use cases (confidence before a meeting, focus at a desk) where a dark UI would be a mismatch; dark mode handles evening/sleep use cases and finally makes the existing brand mark true instead of contradicted.

## 6. Session visual — waveform-as-face

Audio waveform whose peaks/troughs read as eyes and a mouth-line; curvature shifts tense → calm across the session, making the emotional arc visible without a literal illustrated mascot. Built directly as designed, no blob-first intermediate stage.

## 7. Behaviour & habit

- **Streak**: moderate — visible count, honest "still here whenever you're ready" copy (already exists in the codebase), no loss-aversion framing, no restore-streak paywall, no forced sharing.
- **Onboarding**: existing 5 steps, plus one new habit-anchor step — "When would you like to pause each day?" (morning/midday/evening) — inserted before "Almost there." Existing concern-tags (Overthinking, Stress & Anxiety, Better Sleep, Focus & Productivity, Confidence, Emotional Balance) stay as-is: approachable everyday language, better for a first-touch question than the more clinical 10-skill terms.
- **Reminders**: attempt real delivery via the browser's Notification API, with honest copy about the limitation — it only fires while the browser/tab context allows it, there is no backend push infrastructure.

## 8. Explicitly out of scope for v1

No restore-streak paywall. No share-stats push. No forced onboarding. No forced check-ins. No manual theme toggle. Consistent with FOUNDATION's "Things We Will Never Optimize For."

## 9. Constraints carried from prior decisions

- Local-first: no backend/Supabase persistence changes. Everything above is buildable on the existing localStorage architecture (`lib/mvp-storage.ts`, `lib/progress.ts`).
- Internal `ChakraId` model and `data/chakras.ts` stay as the underlying architecture — this roadmap changes what's built on top of it and how it's labeled, not the engine itself.
