import { Hono } from "hono";

import { hashPassword, verifyPassword } from "../auth/password";
import { clearSession, createResetToken, getSessionUser, writeSession } from "../auth/session";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByResetToken,
  setResetToken,
  toPublicUser,
  updateUserPassword,
} from "../auth/users";

export const authRoutes = new Hono();

function publicFromSession(user: { id: string; email: string; fullName: string; phone: string }) {
  return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone };
}

authRoutes.post("/signup", async (c) => {
  const body = (await c.req.json()) as { email?: string; password?: string; fullName?: string };
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  const fullName = body.fullName?.trim() ?? "";

  if (!email || !email.includes("@")) {
    return c.json({ error: "A valid email is required." }, 400);
  }
  if (password.length < 6) {
    return c.json({ error: "Password must be at least 6 characters." }, 400);
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return c.json({ error: "An account with this email already exists." }, 409);
  }

  const { id, user } = await createUser({
    email,
    passwordHash: await hashPassword(password),
    fullName,
  });
  const publicUser = toPublicUser(id, user);
  writeSession(c, publicUser);
  return c.json({ user: publicUser });
});

authRoutes.post("/login", async (c) => {
  const body = (await c.req.json()) as { email?: string; password?: string };
  const email = body.email?.trim() ?? "";
  const password = body.password ?? "";
  if (!email || !password) {
    return c.json({ error: "Email and password are required." }, 400);
  }

  const record = await findUserByEmail(email);
  if (!record || !(await verifyPassword(password, record.passwordHash))) {
    return c.json({ error: "Email or password is incorrect." }, 401);
  }

  const publicUser = toPublicUser(record._id.toString(), record);
  writeSession(c, publicUser);
  return c.json({ user: publicUser });
});

authRoutes.post("/logout", (c) => {
  clearSession(c);
  return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
  const session = getSessionUser(c);
  if (!session) return c.json({ user: null });
  const record = await findUserById(session.id);
  if (!record) {
    clearSession(c);
    return c.json({ user: null });
  }
  return c.json({ user: toPublicUser(record._id.toString(), record) });
});

authRoutes.post("/forgot-password", async (c) => {
  const body = (await c.req.json()) as { email?: string };
  const email = body.email?.trim() ?? "";
  if (!email) {
    return c.json({ error: "Email is required." }, 400);
  }

  const record = await findUserByEmail(email);
  if (record) {
    const token = createResetToken();
    await setResetToken(email, token, new Date(Date.now() + 60 * 60 * 1000));
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    console.log(`Password reset link for ${email}: ${appUrl}/auth/reset-password?token=${token}`);
  }

  return c.json({ ok: true });
});

authRoutes.post("/reset-password", async (c) => {
  const body = (await c.req.json()) as { token?: string; password?: string };
  const token = body.token?.trim() ?? "";
  const password = body.password ?? "";
  if (!token || password.length < 6) {
    return c.json({ error: "A valid reset token and a password of at least 6 characters are required." }, 400);
  }

  const record = await findUserByResetToken(token);
  if (!record) {
    return c.json({ error: "This reset link is invalid or expired." }, 400);
  }

  await updateUserPassword(record._id.toString(), await hashPassword(password));
  return c.json({ ok: true });
});
