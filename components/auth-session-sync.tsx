"use client";

import { useEffect } from "react";

import { setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";

export function AuthSessionSync() {
  useEffect(() => {
    let active = true;
    if (!hasSupabaseBrowserConfig) return;
    const supabase = createSupabaseBrowserClient();

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active || !user) return;
      setMvpAuthenticatedUser(user.id);
      upsertProfile({
        fullName: user.user_metadata?.full_name ?? user.user_metadata?.name ?? "",
        email: user.email ?? "",
        onboardingCompleted: true,
      });
    };

    syncUser();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) return;
      setMvpAuthenticatedUser(session.user.id);
      upsertProfile({
        fullName: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "",
        email: session.user.email ?? "",
        onboardingCompleted: true,
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
