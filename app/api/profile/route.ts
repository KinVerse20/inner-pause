import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfileRow } from "@/lib/supabase/profile";

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json()) as { fullName?: string; email?: string; phone?: string };
  await upsertProfileRow({
    userId: user.id,
    email: body.email ?? user.email,
    fullName: body.fullName ?? user.user_metadata?.full_name ?? "",
    phone: body.phone ?? "",
  });

  return Response.json({ ok: true });
}

