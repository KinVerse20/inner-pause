import type { Context, Next } from "hono";

import { getVerifiedSession } from "./session";

// Admins are configured, not self-assigned: ADMIN_EMAILS is a
// comma-separated allowlist checked on every request, so granting or
// revoking access is an env change with no database migration.
export function isAdminEmail(email: string) {
  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

// Checked against the database too, so a deleted account (or one whose
// password was reset) loses admin access immediately.
export async function requireAdmin(c: Context, next: Next) {
  const verified = await getVerifiedSession(c);
  if (!verified) return c.json({ error: "Authentication required." }, 401);
  if (!isAdminEmail(verified.record.email)) return c.json({ error: "Admin access required." }, 403);
  await next();
}
