# Commercial plan: yearly Pass, trial, install page, bug rewards, 2026-11-26

For whoever builds next. Branch: `feature/our-ui-unification`, after Phase 6 of `docs/BUILD_PLAN.md`.
The same rules as BUILD_PLAN "Before you start" apply: one commit per item, checks before each commit, click through at 390×844 in light and dark, show the founder screenshots.

Each item says what's **decided** (build as written), **proposed** (build as written unless the founder says otherwise) or **needs the founder** (ask first).

## What changes in the product

This plan **replaces PRODUCT_FLOW §36 (Monetization)**. Update §36 and §39.I as part of item C1 so the docs don't contradict the app.

| | Before | Now (decided 26 Nov 2026) |
|---|---|---|
| Paid product | Inner Pause Pass, ₹999 once, kept for life | Inner Pause Pass, **₹1,000 for one year** |
| Free use | A free account for life: Right Now, Ground, Moments, Journal and 2 Practice sessions | **No free version.** A trial of **2 Pause sessions**, then the Pass is needed |
| Lifetime Pass | Sold | No longer sold. Anyone who already holds one keeps it (the code already reads `passLifetime`) |

Never taken away, as before: Journal, Highlights, history and saved Pauses stay readable after the trial or the Pass ends. Only starting new Pauses is locked.

## Order

| Phase | Items | Why this order |
|---|---|---|
| A. Money | C1 Yearly Pass · C2 Trial of 2 Pauses · C3 Pass page | The core of selling; everything else hangs off it |
| B. Getting in | C5 Install page | What the ad sends people to |
| C. Bug rewards | C6 Report a bug · C7 Admin: extend by a month | Uses the yearly end date from C1 |
| D. Launch | C8 Razorpay live | Last, with real keys |
| On hold | C4 Mobile login · C9 Cost sheet | Founder said not now |

---

## Phase A: Money

### C1. The Pass becomes yearly at ₹1,000 (decided)
- `shared/src/brand.ts`: `PASS_PRICE_INR = 1000`. Add `PASS_DURATION_DAYS = 365`.
- `backend/src/pass-store.ts`: a paid order sets `passExpiresAt` to one year from now, or one year from the current end date if the Pass is still active (buying early never loses days). Stop setting `passLifetime` on new purchases; keep reading it for old ones.
- `frontend/lib/entitlements.ts` already handles an end date; check the "expired" state shows correctly.
- Update PRODUCT_FLOW §36 and §39.I copy, and `terms`, `refund-policy` pages for a yearly Pass.
- **Renewal (proposed):** no auto-debit at first. The user pays again for each year. Email 7 days and 1 day before the end date, and show a quiet "Your Pass ends on …" line in You from 7 days before. Razorpay Subscriptions (UPI Autopay / card mandate) can come later; it needs Razorpay approval and more code.
- **Done when:** a test payment gives an end date one year out; renewing while active adds a year to the existing date; an old lifetime account still shows as active.

### C2. Trial: 2 Pause sessions, then the Pass (decided)
- Login is **not** required today (`frontend/proxy.ts` lets every route through; the app works signed out). So a Pause now needs an account: pressing play signed out asks you to sign in or create one, and the trial belongs to the account. Browsing stays open without one.
- Count on the **server**, on the user document (`trialPausesUsed`), so clearing the browser or reinstalling can't reset it.
- **What counts (founder, 26 Nov):** any Pause (Right Now, Ground, Moments, Practice) counts once it has played for **2 minutes** of listened time (the counter from BUILD_PLAN item 6). A Pause stopped before 2 minutes doesn't use up the trial. A Pause shorter than 2 minutes counts when it finishes.
- Without an active Pass and after 2 Pauses: browsing, Journal and history stay open; pressing play on any Pause opens the Pass page (C3) instead. Never cut off a Pause that is already playing.
- Show the count plainly before it runs out, for example "1 of 2 trial Pauses left".
- Replace the old free/Pass gates (Practice two-session sample, `FREE_WINDOW_ENTRIES` in `frontend/lib/pattern-engine.ts`) with this one rule: active Pass or trial left.
- **Done when:** a new account plays 2 Pauses, the third play opens the Pass page, a new browser on the same account still shows 0 left, and buying the Pass unlocks play at once.

### C3. Pass page with the offer price (decided)
- Rework `frontend/components/you-pass-screen.tsx`: the price, what's included, the end date when active, "Renew" when it's ending or ended.
- **Price shown as ~~₹2,000~~ ₹1,000 with "50% off" (founder, 26 Nov).** ₹2,000 is the Pass's real list price and ₹1,000 is a launch offer. Keep both in `shared/src/brand.ts` (`PASS_LIST_PRICE_INR = 2000`, `PASS_PRICE_INR = 1000`), so ending the offer is a one-line change. Name it as an offer on the page ("Launch offer"). India's dark patterns guidelines (CCPA, 2023) treat a struck-out price that is never charged as misleading, so the offer should end at some point and ₹2,000 then be charged.
- Copy follows DESIGN_SYSTEM §14: calm, no countdowns, no pressure.

## Phase B: Getting in

### C4. Mobile number login (ON HOLD, founder 26 Nov: don't build yet; email login stays the only way in)
- Email and password login already exist (sign up, log in, forgot and reset password). Add **mobile number + OTP** as a second way in, on the same `/auth` page.
- One account per person: a user can add the other method later in You → Account.
- **Needs the founder, the SMS provider:**
  - MSG91 or Twilio: about ₹0.15 to ₹0.25 per OTP, but India needs **DLT registration** (sender ID and template, a few days to a couple of weeks) before any SMS goes out.
  - Firebase phone auth: no DLT work for us, free for a small number of logins a month and then paid per SMS; adds a Google dependency.
- Rate-limit OTP requests per number and per IP (`backend/src/rate-limit.ts` exists).
- **Done when:** a new user can sign up with only a phone number, and an existing email user can add a number and log in with either.

### C5. Install page for the ads (decided)
- The app is already a PWA: manifest (`frontend/app/manifest.ts`), service worker (`frontend/public/sw.js`), icons, offline page.
- New public page `/install` (add to the public routes in `frontend/proxy.ts`): what Inner Pause is in one line, the Pass price, an **Install** button, then "Sign in" once installed.
- Android Chrome: the button fires the browser's install prompt. Reuse the unused `frontend/components/install-pwa-prompt.tsx` (BUILD_PLAN item 16).
- iPhone: Apple allows no install button. Show the two steps (Share → Add to Home Screen) with a picture instead.
- Already installed: the page sends the user straight into the app.
- Add UTM tracking on the URL so ad clicks can be counted.
- **Done when:** on a real Android phone the button installs the app; on a real iPhone the steps work; both open the app from the home screen icon.

## Phase C: Bug rewards

### C6. Report a bug (decided)
- New page `/report-bug`, linked from You and Help: a text box ("What happened?") and a screenshot upload (optional, image only, up to 5 MB). The app version and phone/browser are attached automatically.
- A short message where people will see it (You screen and Help): "Found a bug? Tell us. If it's real, you get a month of Pass free."
- Stored in a `bug_reports` collection; screenshots in S3 like sound uploads (`backend/src/file-store.ts`). Email the founder on each new report (`backend/src/mailer.ts`).
- Status per report: New, Valid, Not a bug, Duplicate.
- **Done when:** a report with a screenshot arrives, the founder gets the email, the user sees "Thanks, we'll look at it".

### C7. Admin: extend a user's Pass by one month (decided)
- There's no admin role today. Add an `ADMIN_EMAILS` setting in `.env`; only those accounts can open `/admin`.
- `/admin/bugs`: list of reports with the screenshot, text and user. Buttons: **Valid, give 1 month** · Not a bug · Duplicate.
- "Valid" adds 30 days to the user's `passExpiresAt` (from today if they have no active Pass, so a trial user gets a month of Pass), records who gave it and why, and emails the user. One reward per report; the button can't be pressed twice.
- Also on `/admin`: find a user by email or phone and extend by a month by hand (for support cases).
- **Done when:** marking a report Valid moves that user's end date 30 days later and the user sees it in You.

## Phase D: Launch

### C8. Razorpay live (decided)
- Razorpay is already built: order, signature check and webhook (`backend/src/routes/pass.ts`). Try it end to end with `rzp_test_` keys first, then put the live keys and webhook secret in `/opt/innerpause/.env`.
- Razorpay KYC and website review need the terms, privacy and refund pages live (they exist; update them in C1).

### C9. Cost sheet (LEFT FOR LATER, founder 26 Nov; notes kept below)
A spreadsheet of monthly cost at 100, 1,000 and 10,000 users, assuming heavy use per user (founder to confirm the number of Pauses per day). Lines:
- Server (EC2): t4g.micro today (about ₹550 a month); t4g.small about ₹1,100 once audio rendering (ffmpeg on the server) gets busy.
- MongoDB Atlas: free tier at first, M10 (about ₹5,000 a month) when needed.
- S3 storage and data out (audio is the main cost as users grow; see BUILD_PLAN item 17, CDN).
- OpenAI (`gpt-4.1-mini`) for Tell: per call cost × calls per user.
- SMS OTP (C4): per login.
- Email (SMTP).
- Razorpay: about 2% + 18% GST on the fee, so about ₹24 on every ₹1,000 Pass.

## Answered by the founder, 26 Nov
- **C3:** ₹2,000 struck out, ₹1,000 as the offer.
- **C2:** a Pause counts after 2 minutes listened.
- **C4:** on hold. When it comes back: MSG91/Twilio with DLT, or Firebase phone auth?
- **C9:** left for later. When it comes back: what is "maximum usage" per user per day, and how many users to plan for?
