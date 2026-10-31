import { SUPPORT_EMAIL } from "@inner-pause/shared";
import { Hono } from "hono";

import { isAdminEmail } from "../auth/admin";
import { hashPassword, verifyPassword } from "../auth/password";
import { clearSession, createResetToken, getVerifiedSession, writeSession } from "../auth/session";
import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserByResetToken,
  normalizeEmail,
  setResetToken,
  toPublicUser,
  updateUserPassword,
} from "../auth/users";
import { invalidBody, readJsonObject, stringField } from "../http";
import { mailerConfigured, sendPasswordResetEmail } from "../mailer";
import type { UserDocument } from "../mongo";
import { detachOrdersFromUser, passStateOf } from "../pass-store";
import { clearEvents, countRecent, recordEvent } from "../rate-limit";

export const authRoutes = new Hono();

const MAX_EMAIL_LENGTH = 254;
const MAX_NAME_LENGTH = 80;
// bcrypt only uses a password's first 72 bytes; a cap keeps hashing cheap.
const MAX_PASSWORD_LENGTH = 128;

// Passwords are taken as typed (never trimmed: spaces can be intentional).
const passwordField = (value: unknown) => (typeof value === "string" ? value : "");

// Role is derived per request from ADMIN_EMAILS (auth/admin.ts), never
// stored in the session cookie, so revoking access takes effect at once.
// The Pass comes from the account record, so it follows the user anywhere.
function withAccount<T extends { email: string }>(user: T, record: Pick<UserDocument, "passExpiresAt">) {
  return { ...user, isAdmin: isAdminEmail(user.email), pass: passStateOf(record) };
}

// Wrong passwords per account before sign-in pauses, and for how long.
const LOGIN_FAILURE_LIMIT = 10;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
// Reset emails per address per hour.
const RESET_EMAIL_LIMIT = 3;
const RESET_WINDOW_MS = 60 * 60 * 1000;

const isDuplicateKeyError = (error: unknown) => typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;

authRoutes.post("/signup", async (c) => {
  const body = await readJsonObject(c);
  if (!body) return invalidBody(c);
  const email = stringField(body.email);
  const password = passwordField(body.password);
  const fullName = stringField(body.fullName, MAX_NAME_LENGTH);

  if (!email || !email.includes("@") || email.length > MAX_EMAIL_LENGTH) {
    return c.json({ error: "A valid email is required." }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters." }, 400);
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return c.json({ error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters.` }, 400);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return c.json({ error: "An account with this email already exists." }, 409);
  }

  let created: Awaited<ReturnType<typeof createUser>>;
  try {
    created = await createUser({ email, passwordHash: await hashPassword(password), fullName });
  } catch (error) {
    // Two sign-ups for the same email at once: the unique index catches it.
    if (isDuplicateKeyError(error)) return c.json({ error: "An account with this email already exists." }, 409);
    throw error;
  }
  const publicUser = toPublicUser(created.id, created.user);
  writeSession(c, publicUser);
  return c.json({ user: withAccount(publicUser, created.user) });
});

authRoutes.post("/login", async (c) => {
  const body = await readJsonObject(c);
  if (!body) return invalidBody(c);
  const email = stringField(body.email, MAX_EMAIL_LENGTH);
  const password = passwordField(body.password);
  if (!email || !password) {
    return c.json({ error: "Email and password are required." }, 400);
  }

  // Too many wrong passwords for this account: pause before trying again.
  const failureKey = `login-failure:${normalizeEmail(email)}`;
  if (countRecent(failureKey, LOGIN_WINDOW_MS) >= LOGIN_FAILURE_LIMIT) {
    return c.json({ error: "Too many sign-in attempts. Please wait 15 minutes, or reset your password." }, 429);
  }

  const record = await findUserByEmail(email);
  if (!record || password.length > MAX_PASSWORD_LENGTH || !(await verifyPassword(password, record.passwordHash))) {
    recordEvent(failureKey, LOGIN_WINDOW_MS);
    return c.json({ error: "Email or password is incorrect." }, 401);
  }
  clearEvents(failureKey);

  const publicUser = toPublicUser(record._id.toString(), record);
  writeSession(c, publicUser);
  return c.json({ user: withAccount(publicUser, record) });
});

authRoutes.post("/logout", (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ user: null });
  return c.json({ user: withAccount(toPublicUser(verified.record._id.toString(), verified.record), verified.record) });
});

// Deletes the account itself (You → Data & Privacy → Delete account): the
// user record goes; Pass payment records are kept, as the law requires, but
// no longer linked to anyone.
authRoutes.post("/delete-account", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ error: "Authentication required." }, 401);
  const userId = verified.record._id.toString();
  await detachOrdersFromUser(userId);
  await deleteUser(userId);
  clearSession(c);
  return c.json({ ok: true });
});

authRoutes.post("/forgot-password", async (c) => {
  const body = await readJsonObject(c);
  if (!body) return invalidBody(c);
  const email = stringField(body.email, MAX_EMAIL_LENGTH);
  if (!email) {
    return c.json({ error: "Email is required." }, 400);
  }

  const production = process.env.NODE_ENV === "production";
  // Without email set up, a live app can't deliver the link: say so (the
  // same answer for every address, so it reveals nothing about accounts).
  if (production && !mailerConfigured()) {
    return c.json({ error: `Password reset by email isn't set up yet. Email ${SUPPORT_EMAIL} and we'll help you back in.` }, 503);
  }

  const resetKey = `reset-email:${normalizeEmail(email)}`;
  const record = await findUserByEmail(email);
  // Each address gets a few emails an hour at most; extra requests get the
  // same reply, so nobody can flood an inbox or learn who has an account.
  if (record && countRecent(resetKey, RESET_WINDOW_MS) < RESET_EMAIL_LIMIT) {
    recordEvent(resetKey, RESET_WINDOW_MS);
    const token = createResetToken();
    await setResetToken(email, token, new Date(Date.now() + 60 * 60 * 1000));
    const appUrl = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
    const link = `${appUrl}/auth/reset-password?token=${token}`;
    if (mailerConfigured()) {
      try {
        await sendPasswordResetEmail(record.email, link);
      } catch (error) {
        // Logged without the link: a reset link in a log is a way in.
        console.error("[mail] reset email failed:", error instanceof Error ? error.message : error);
      }
    } else {
      // Development without email: the link goes to the server log instead.
      console.log(`Password reset link for ${email}: ${link}`);
    }
  }

  return c.json({ ok: true });
});

authRoutes.post("/reset-password", async (c) => {
  const body = await readJsonObject(c);
  if (!body) return invalidBody(c);
  const token = stringField(body.token, 200);
  const password = passwordField(body.password);
  if (!token || password.length < 6 || password.length > MAX_PASSWORD_LENGTH) {
    return c.json({ error: "A valid reset token and a password of 6 to 128 characters are required." }, 400);
  }

  const record = await findUserByResetToken(token);
  if (!record) {
    return c.json({ error: "This reset link is invalid or expired." }, 400);
  }

  // Also signs out every existing session (auth/session.ts checks the
  // password-change time), in case the old password was compromised.
  await updateUserPassword(record._id.toString(), await hashPassword(password));
  return c.json({ ok: true });
});
