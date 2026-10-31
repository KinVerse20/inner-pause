"use client";

import { useEffect } from "react";

import { applyServerAccount, clearAccount } from "@/lib/account-store";
import { getCurrentUser } from "@/lib/auth-client";
import { clearMvpAuthenticatedUser, setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";

export function AuthSessionSync() {
  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      let user: Awaited<ReturnType<typeof getCurrentUser>>;
      try {
        user = await getCurrentUser();
      } catch {
        // Offline or the server is down: keep the local account as it is.
        return;
      }
      if (!active) return;
      if (!user) {
        clearMvpAuthenticatedUser();
        clearAccount();
        return;
      }
      setMvpAuthenticatedUser(user.id);
      upsertProfile({
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      });
      applyServerAccount(user);
    };

    void syncSession();
    return () => {
      active = false;
    };
  }, []);

  return null;
}
