# Temporary remote testing

This preview runs the revised frontend, local PostgreSQL API and audio assets on Sahil's Mac. It does not use AWS and does not change the live website.

## Access

A Cloudflare Quick Tunnel forwards HTTPS requests to the password-protected gateway on `127.0.0.1:3012`. Its current URL, generated password, process IDs and logs are stored outside the project under `/Users/sahil/Library/Application Support/InnerPause Preview` (directory mode 700, credentials mode 600). Share the URL and testing password with Karsh. Enter the password, then choose **Start testing**. All visitors using this password share the dedicated User B test identity and its feedback history.

The gateway authenticates pages, API calls and audio requests. It forwards only the revised-flow API endpoints and `/me`, forces the User B identity, rejects cross-origin mutations, and blocks administration. The API and frontend listen only on loopback. Test tokens grant no direct remote access. This is a temporary testing configuration, not production authentication.

The Mac must stay connected with the lid open. A `caffeinate -i` process prevents idle sleep while the tunnel runs. Closing the lid, rebooting, stopping the tunnel or losing internet interrupts access. The URL changes when a new quick tunnel starts. No automatic restart at login is installed.

## Processes

- API: `127.0.0.1:4011`, PostgreSQL database `innerpause_revised_test_20261110`, test authentication, AI and notifications disabled.
- Frontend: `127.0.0.1:3011`, built with `NEXT_PUBLIC_SHARED_TEST_AUTH=true`, `NEXT_PUBLIC_LOCAL_TEST_AUTH=false`, `NEXT_PUBLIC_API_BASE_URL=/api/v1`.
- Gateway: `127.0.0.1:3012`, run `node scripts/preview-gateway.mjs` with `PREVIEW_SECRET_FILE` pointing at the private JSON file and `PREVIEW_PUBLIC_URL` set to the exact HTTPS tunnel origin. This handles forwarded-host differences and enforces secure cookies and same-origin mutations.
- Tunnel: `cloudflared tunnel --no-autoupdate --url http://127.0.0.1:3012`.

The gateway is required with this shared build. Use the public tunnel URL while `PREVIEW_PUBLIC_URL` is configured. For loopback-only testing, omit that variable and use `http://127.0.0.1:3012`. Rebuilding with the original local flags restores the old direct port-3011 local sign-in. Shared builds disable service-worker installation so cached responses do not bypass preview access checks.

## Validation

- `node --test scripts/preview-gateway.test.mjs` checks authentication, blocked endpoints, identity spoofing, request parsing and cross-origin rejection.
- `npm --prefix frontend test` includes local and shared preview configuration guards.
- From `frontend`, run Playwright with `PREVIEW_TEST_URL` set to the tunnel URL and `PREVIEW_SECRET_FILE` set to the private credentials file: `npx playwright test --config playwright.shared-preview.config.ts`.
- Browser coverage includes fresh password sign-in, all seven sound choices, all seven tone decodes, pause/resume, switching, skipping, saved feedback, written-input rules, early exit and mobile layout. Long sessions are not listened to in full.

Verified on 20 November 2026 through the public HTTPS tunnel: both browser scenarios passed (11.2 seconds). The 32 frontend tests, two gateway tests, frontend production build, backend TypeScript check and focused lint passed. Browser testing found and corrected a form Origin-header issue caused by the login response's referrer policy, and a sign-in button that could be clicked before hydration over a network connection. The button now stays disabled until its handler is ready. All services and the tunnel remain running as detached local processes.

## Repository note

On 20 November, the revised checkout's `.git` still pointed to `/Users/sahil/Documents/Healing App/.git/worktrees/Healing-App-Revised-Flow`, but that parent directory was absent. Files were preserved and updated in the existing revised checkout. No Git reinitialization, remote push, merge or live deployment was performed.
