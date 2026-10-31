import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { Context } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";

import { findUserById } from "./users";

const COOKIE_NAME = "ip_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
}

function authSecret() {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", authSecret()).update(payload).digest("base64url");
}

export function createSessionToken(user: SessionUser) {
  const now = Date.now();
  const body = Buffer.from(
    JSON.stringify({
      ...user,
      iat: now,
      exp: now + MAX_AGE_SECONDS * 1000,
    }),
  ).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** A session read from its cookie, with when it was issued (0 for older cookies). */
export type SessionClaims = SessionUser & { issuedAt: number };

export function readSessionToken(token: string | undefined): SessionClaims | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = sign(body);
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionUser & { exp?: number; iat?: number };
    if (!parsed.id || !parsed.email || typeof parsed.exp !== "number" || parsed.exp < Date.now()) {
      return null;
    }
    return {
      id: parsed.id,
      email: parsed.email,
      fullName: parsed.fullName ?? "",
      phone: parsed.phone ?? "",
      issuedAt: typeof parsed.iat === "number" ? parsed.iat : 0,
    };
  } catch {
    return null;
  }
}

/**
 * The cookie's session, trusted as signed but not checked against the
 * database. For anything that changes data or grants access, use
 * getVerifiedSession.
 */
export function getSessionUser(c: Context): SessionClaims | null {
  return readSessionToken(getCookie(c, COOKIE_NAME));
}

/**
 * The session plus its user record, or null — and the cookie cleared — when
 * the account no longer exists or its password changed after the session
 * was issued (a reset signs out every existing session).
 */
export async function getVerifiedSession(c: Context) {
  const session = getSessionUser(c);
  if (!session) return null;
  const record = await findUserById(session.id);
  if (!record || (record.passwordChangedAt && session.issuedAt < record.passwordChangedAt.getTime())) {
    clearSession(c);
    return null;
  }
  return { session, record };
}

export function writeSession(c: Context, user: SessionUser) {
  setCookie(c, COOKIE_NAME, createSessionToken(user), {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSession(c: Context) {
  deleteCookie(c, COOKIE_NAME, { path: "/" });
}

export function createResetToken() {
  return randomBytes(32).toString("hex");
}

export function hashResetToken(token: string) {
  return createHmac("sha256", authSecret()).update(token).digest("hex");
}
