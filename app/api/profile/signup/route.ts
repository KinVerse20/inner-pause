import { upsertProfileRow } from "@/lib/supabase/profile";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = (await request.json()) as { userId?: string; email?: string; fullName?: string };
  if (!body.userId || !body.email) {
    return Response.json({ error: "User id and email are required." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(body.userId);
  if (error || !data.user || data.user.email !== body.email) {
    return Response.json({ error: "Could not verify signup user." }, { status: 403 });
  }

  await upsertProfileRow({
    userId: body.userId,
    email: body.email,
    fullName: body.fullName ?? "",
  });

  return Response.json({ ok: true });
}
