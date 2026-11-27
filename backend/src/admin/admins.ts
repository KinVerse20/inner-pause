import type { Context } from "hono";

import { getVerifiedSession } from "../auth/session";

// Who can open /admin (bug reports, extending a Pass): the accounts whose
// email is in ADMIN_EMAILS (comma separated). Nobody, until it's set.

export function adminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/** The signed-in admin, or null for anyone else (signed out, or not an admin). */
export async function getAdmin(c: Context) {
  const verified = await getVerifiedSession(c);
  if (!verified || !adminEmails().includes(verified.record.email.toLowerCase())) return null;
  return verified;
}
