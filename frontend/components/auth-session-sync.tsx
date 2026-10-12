"use client";

import { useEffect } from "react";

import { applyServerAccount, clearAccount } from "@/lib/account-store";
import { getCurrentUser } from "@/lib/auth-client";
import { clearMvpAuthenticatedUser, setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";

export function AuthSessionSync() {
  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const user = await getCurrentUser();
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
