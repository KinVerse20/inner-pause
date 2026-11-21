import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { upsertProfileRow } from "@/lib/supabase/profile";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (!code) {
    return NextResponse.redirect(new URL("/auth?message=Confirmation link is missing or expired.", origin));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/auth?message=${encodeURIComponent("Could not verify your account. Please request a new verification email.")}`, origin));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await upsertProfileRow({
      userId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
    }).catch(() => undefined);
  }

  return NextResponse.redirect(new URL("/", origin));
}

