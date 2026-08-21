"use client";

import { useEffect } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";

import { clearMvpAuthenticatedUser, setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { hasSupabaseBrowserConfig } from "@/lib/supabase/config";

export function AuthSessionSync() {
  useEffect(() => {
    let active = true;
    if (!hasSupabaseBrowserConfig) return;
    const supabase = createSupabaseBrowserClient();

    const syncSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.user) {
        clearMvpAuthenticatedUser();
        return;
      }
      setMvpAuthenticatedUser(session.user.id);
      upsertProfile({
        fullName: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "",
        email: session.user.email ?? "",
      });
    };

    syncSession();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        clearMvpAuthenticatedUser();
        return;
      }
      setMvpAuthenticatedUser(session.user.id);
      upsertProfile({
        fullName: session.user.user_metadata?.full_name ?? session.user.user_metadata?.name ?? "",
        email: session.user.email ?? "",
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
