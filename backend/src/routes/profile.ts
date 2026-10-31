import { Hono } from "hono";

import { getVerifiedSession, writeSession } from "../auth/session";
import { toPublicUser, updateUserProfile } from "../auth/users";
import { invalidBody, readJsonObject } from "../http";

export const profileRoutes = new Hono();

profileRoutes.post("/", async (c) => {
  const verified = await getVerifiedSession(c);
  if (!verified) {
    return c.json({ error: "Authentication required." }, 401);
  }

  const body = await readJsonObject(c);
  if (!body) return invalidBody(c);
  const updated = await updateUserProfile(verified.session.id, {
    fullName: typeof body.fullName === "string" ? body.fullName : undefined,
    phone: typeof body.phone === "string" ? body.phone : undefined,
  });
  if (!updated) {
    return c.json({ error: "Account not found." }, 404);
  }

  const user = toPublicUser(updated._id.toString(), updated);
  writeSession(c, user);
  return c.json({ ok: true, user });
});
