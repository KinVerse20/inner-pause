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

## 3. Razorpay (the Inner Pause Pass, ₹199 for 60 days)

1. Create a Razorpay account and complete KYC. Razorpay reviews the website:
   the Terms (`/terms`), Privacy Policy (`/privacy-policy`), Refund and
   cancellation policy (`/refund-policy`) and contact details (You → Help)
   are in the app for this.
2. Start with Test Mode keys (`rzp_test_…`): set `RAZORPAY_KEY_ID` and
   `RAZORPAY_KEY_SECRET`, buy a Pass with a test card or UPI ID, and check it
   unlocks Practice.
3. Dashboard → Webhooks → Add: URL `https://<your-domain>/api/pass/webhook`,
   events `payment.captured` and `order.paid`, and a secret, which goes in
   `RAZORPAY_WEBHOOK_SECRET`. This grants the Pass even if someone closes the
   app straight after paying.
4. Switch to Live Mode keys when ready.

The price and length are in `shared/src/brand.ts` (`PASS_PRICE_INR`,
`PASS_DAYS`).

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
- Set `ADMIN_EMAILS` to the admin accounts only.
- Run `npm audit --omit=dev` and keep Next.js up to date.
