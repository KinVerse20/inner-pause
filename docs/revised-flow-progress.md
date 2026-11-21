# Revised flow — local implementation and testing

## Phase One Pause rebuild — 21 November 2026

The local root route now contains the complete approved Phase One experience in the new cream, navy and purple Inner Pause design. It does not change or deploy the production app.

- Animated entry ritual and redesigned Home with six ready-made Pauses.
- Private journal that saves writing locally and never analyses it.
- Direct selection from 22 emotions, with a maximum of four per Pause.
- Emotion-to-chakra results, individual chakra explanations and a complete seven-chakra guide.
- Custom Pause setup and review with sequential frequencies, 5/10/15 minutes per frequency, five sound experiences and Soft/Balanced/Clear undertone levels.
- Audio player with continuous exact-frequency undertones, pause/resume, skip, exit, live sound switching and crossfades without resetting progress.
- 36 ready-made Moments: 12 Coming Up, 12 Happening Now and 12 Just Happened.
- Post-session feedback, Pause history, reflection history, profile, saved default sound settings, local reminders, About sequence, privacy controls and draft legal copy.

Current approved sounds are Rain, Forest, Ocean Waves, Gentle Wind and Frequency Only. The four ambience recordings decode as stereo AAC at 48 kHz. The seven reusable tone files were spectrally checked at exactly 396, 417, 528, 639, 741, 852 and 963 Hz. Tone levels are Soft −48 dB, Balanced −45 dB and Clear −39 dB.

Final local verification:

- Production build: passed.
- Frontend/unit suite: 35 passed.
- Browser integration: 4 passed, covering the full custom journey, live sound changes, feedback/history, journal privacy, all 36 Moments and mobile width.
- Focused ESLint: passed.
- Audio decode and exact-frequency checks: passed.

Local preview: `http://127.0.0.1:3011`. No login is required for this local Phase One preview. AWS, Cognito, remote deployment and the live site remain unchanged.

Branch: `Revised-Flow-10th-Nov`.
Worktree: `/Users/sahil/Documents/Healing App Revised Flow`.
Entry point: `/local-test-sign-in`, then `/revised`, in the separated frontend. The branch now uses the live site's cream/navy design language and shared bottom navigation; the live deployment is unchanged.

## Eight functional stages

1. **Emotion foundation:** 22 selectable emotions, synonyms, seven categories, maximum seven selections and versioned chakra mappings. Associations are product choices within a traditional chakra framework, not diagnoses.
2. **Detection:** non-AI rules with multi-emotion suggestions, word boundaries, evidence, selected negation/contrast handling, and mandatory confirmation. Unmatched text does not invent emotions. Confidence describes rule matches, not measured accuracy; broader representative-language evaluation remains a release consideration.
3. **Planning:** confirmed emotions only; shared chakras merged; root-to-crown ordering; Quick/Complete/Deep provide 5/10/15 minutes per frequency. Four chakras at 15 minutes total one hour.
4. **Database and APIs:** authenticated catalog/detection/journey/history/feedback endpoints, PostgreSQL storage, an additive migration, and catalog snapshots containing synonyms and mappings. Written and direct inputs are supported. Ownership checks prevent cross-user reads and writes.
5. **Audio:** seven existing ElevenLabs recordings imported with generation IDs in `audio-sources/elevenlabs/manifest.json`. No new generations were requested. Sources are preserved; prepared AAC files use 48 kHz, loudness normalization and tail/head crossfades. Six loops are 29 seconds; Piano is 299 seconds. Seven reusable exact-frequency WAV loops supply undertones. Soft/Balanced/Clear use -30/-24/-18 dBFS tone peaks (digital levels, not headphone sound-pressure levels).
6. **Playback:** sequential frequencies, pause/resume, skip, exit, crossfading sound changes and live tone presets. Sound switching preserves session timing. Every imported audio file decoded successfully in Chromium.
7. **Journey saving:** confirmed plan, input, settings, completed/exited outcome and feedback persist in PostgreSQL and appear in journey history. Browser reload and independent repository-instance tests verify persistence.
8. **Local integration:** the seven-screen journey is wired on `/revised`, reusing the app's existing shell/cards. Written and direct flows, early exit, completion via skipping, feedback, mobile width, and the absence of calls to the old AI analysis endpoint are covered by browser tests. Existing app routes still use their existing behavior; rollout to them is not part of this local preview.

## Verification

- Backend TypeScript check: passed.
- Backend suite: 40 passed, including real PostgreSQL, all seven ambient-file decodes/levels and tone spectral checks.
- Frontend suite: 31 passed, including local-only sign-in guards.
- Browser integration: 3 scenarios passed three consecutive times (9 executions) against the production frontend build and PostgreSQL-backed local API using local test authentication.
- Production frontend build: passed.
- Focused ESLint checks on the new screen/player/clock: passed.
- No real Cognito/AWS/deployed-browser validation has been claimed.
- Full-duration 5–105 minute sessions were not listened to end-to-end; timing uses deterministic clock tests, and browser tests exercise skip/transition behavior.

### Retest on 10 November 2026

The full retest exposed a first-install service-worker race: claiming the page triggered an unsolicited reload, clearing a reflection typed just before activation. The registration handler now reloads only after this tab explicitly requests Refresh, and the revised journey hides the update prompt to avoid interrupting its independent audio player. A browser regression test delays service-worker installation until a draft has been entered, then verifies that the draft and enabled Continue button survive activation without navigation. All 40 backend tests, 30 frontend tests, 9 browser executions, the production build and focused ESLint checks passed after the fix. Changes remain local to the revised branch; no AWS changes were made.

## Local test setup

- Frontend: localhost port 3011, with `NEXT_PUBLIC_API_BASE_URL=http://localhost:4011/api/v1`, `NEXT_PUBLIC_APP_URL=http://localhost:3011` and `NEXT_PUBLIC_LOCAL_TEST_AUTH=true` at build time. Open `http://localhost:3011/local-test-sign-in` and select **Enter local test app**. No password is required. The test identity is accepted by the local test API; this is not an AWS account or production sign-in bypass. Both browser and API must be on loopback hosts.
- API: localhost port 4011, `REPOSITORY_MODE=postgres`, local test authentication.
- Dedicated local PostgreSQL database: `innerpause_revised_test_20261110`. Contains synthetic test users, catalog and journey records only; existing databases were not migrated.
- Browser command from frontend: `./node_modules/.bin/playwright test --config playwright.revised.config.ts`.
- PostgreSQL test uses `REVISED_TEST_DATABASE_URL` and refuses non-local/non-test targets.
- Source preparation: `node scripts/prepare-revised-sounds.mjs` (requires FFmpeg).

## Deployment status

### Local sign-in and UI update — 10 November 2026

Added an explicit local sign-in page that validates the local API before storing a test session. Matched the public live-site color tokens, sans-serif typography, rounded cards, centered layout and five-item bottom navigation across the shared shell; restyled all revised journey steps. The navigation retains this branch's existing destination screens. This is a design adaptation, not an import of the live site's unavailable source. Verified fresh-browser sign-in, session restoration, mobile layout and both complete revised journey flows: four browser scenarios passed. Production build, 31 frontend tests and focused lint passed. Backend behavior was unchanged in this update; its prior 40-test validation remains recorded above.

AWS profiles returned invalid or expired credentials. The user explicitly chose **finish local testing only for now** instead of starting AWS login. No login, AWS deployment, remote push, merge to main, or production database migration was performed.

When deployment is requested, authenticate and verify the AWS account/test target, deploy the isolated branch and additive migration, configure Cognito and the real API URL, then rerun deployed integration checks. Production remains unchanged until the separate merge/deployment decision.
