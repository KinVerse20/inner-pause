import { Hono } from "hono";

import { getSessionUser, writeSession } from "../auth/session";
import { findUserById, toPublicUser, updateUserProfile } from "../auth/users";

export const profileRoutes = new Hono();

profileRoutes.post("/", async (c) => {
  const session = getSessionUser(c);
  if (!session) {
    return c.json({ error: "Authentication required." }, 401);
  }

  const body = (await c.req.json()) as { fullName?: string; phone?: string };
  const updated = await updateUserProfile(session.id, {
    fullName: body.fullName,
    phone: body.phone,
  });
  if (!updated) {
    return c.json({ error: "Account not found." }, 404);
  }

  const user = toPublicUser(updated._id.toString(), updated);
  writeSession(c, user);
  return c.json({ ok: true, user });
});
