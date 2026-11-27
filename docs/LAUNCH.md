# Going live

What the live server needs, beyond what development uses. Every setting
below is listed, with comments, in `backend/.env.example`.

## 1. HTTPS

Serve the app over HTTPS on your own domain. Sign-in cookies, installing the
app, offline mode and the microphone (Speak) all require it.

Build the frontend with the backend's address, which Next.js fixes at build
time:

```
API_URL=https://<api-address> npm run build
```

Set `APP_URL` to the public address (used in password reset links) and
`FRONTEND_ORIGIN` to the same.

## 2. Password reset email

Any SMTP provider works. On AWS, use Amazon SES:

1. SES → Verified identities: verify your domain (or a sender address).
2. Request production access (new SES accounts can only send to verified
   addresses).
3. SES → SMTP settings → Create SMTP credentials.
4. Set `SMTP_HOST` (for example `email-smtp.ap-south-1.amazonaws.com`),
   `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`, and
   `MAIL_FROM="Inner Pause <no-reply@your-domain>"`.

Until these are set, the live app tells people that reset by email isn't
available yet and to email the support address.

## 3. Razorpay (the Inner Pause Pass, ₹1,000 a year)

1. Create a Razorpay account and complete KYC. Razorpay reviews the website:
   the Terms (`/terms`), Privacy Policy (`/privacy-policy`), Refund and
   cancellation policy (`/refund-policy`) and contact details (You → Help)
   are in the app for this.
2. Start with Test Mode keys (`rzp_test_…`) in `/opt/innerpause/.env`:
   `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Restart the API.
3. Dashboard (Test Mode) → Webhooks → Add: URL
   `https://<your-domain>/api/pass/webhook`, events `payment.captured` and
   `order.paid`, and a secret, which goes in `RAZORPAY_WEBHOOK_SECRET`. This
   grants the Pass even if someone closes the app straight after paying.
4. **Test checklist**, on a phone, with a new account:
   - Play 2 Pauses past 2 minutes each; the third shows "Ready to keep going?".
   - You → Inner Pause Pass shows ~~₹2,000~~ ₹1,000. Pay with Razorpay's
     test UPI ID `success@razorpay` (or a test card). The page says "Your
     Pass is on until …" a year from today, and Pauses play again.
   - Dashboard → Payments shows ₹1,000 captured; Webhooks shows the event
     delivered with 200.
   - Pay again with `failure@razorpay`: "Payment failed", nothing changes.
   - Close the payment window without paying: nothing changes, no message.
5. Switch to Live Mode: generate live keys (`rzp_live_…`) and add the same
   webhook again in Live Mode (it has its own secret). Put all three in
   `.env`, restart the API, and make one real ₹1,000 payment with your own
   account. Refund it from the Dashboard if you like (the Pass stays on that
   account).
6. Set `ADMIN_EMAILS` to the founder's account email (comma separated for
   more than one), so /admin works and bug reports arrive by email. The
   account itself is an ordinary sign up with that email; restart the API
   after changing the list. Admin accounts have everything without buying
   (they read as a Pass for life) and are never charged.

The prices are in `shared/src/brand.ts`: `PASS_PRICE_INR` (charged, ₹1,000
during the launch offer) and `PASS_LIST_PRICE_INR` (₹2,000, shown struck out).
To end the offer, set `PASS_PRICE_INR` to the list price. A payment adds 365
days to the account's `passExpiresAt` (from its end date if the Pass is still
on), so buying early never loses days. Nothing renews by itself: the server
emails 7 days and 1 day before the end (needs the email settings in step 2).
Accounts that bought the earlier lifetime Pass keep `passLifetime` and can't
be charged again.

## 4. Sound storage on S3

On the Inner Pause AWS account, the bucket is
`theinnerpause-files-735381631291`. For how the server reaches it, see
`deploy/ec2/README.md`. For a new account:

1. Create a private S3 bucket (for example in `ap-south-1`, Mumbai).
2. Give the server an IAM role allowing `s3:GetObject`, `s3:PutObject`,
   `s3:DeleteObject` and `s3:ListBucket` on that bucket.
3. Set `S3_BUCKET` and `S3_REGION`.

Sounds uploaded before this live on the server's disk in `backend/uploads`.
Copy them into the bucket under the prefix (default `inner-pause/`) keeping
the same file names, for example
`aws s3 sync backend/uploads s3://<bucket>/inner-pause/`. Tuned files are
rebuilt automatically if missing.

## 5. Before opening the doors

- Read the Terms, Privacy Policy and Refund policy and adjust them to your
  business; ideally have a lawyer review them. They are written to match
  what the app does today.
- Set a long random `AUTH_SECRET` (changing it later signs everyone out).
- For Practice reminders, set `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` (`npx web-push generate-vapid-keys`, once; changing them later drops every reminder). Reminders need the site on HTTPS.
- For the optional journal backup, set `JOURNAL_ENCRYPTION_KEY` (`openssl rand -base64 32`) and keep it safe with your other secrets: losing or changing it makes existing backups unreadable.
- Run `npm audit --omit=dev` and keep Next.js up to date.
