"use client";

import { useEffect } from "react";

import { createFrontendApiClient, readFrontendProfile, setFrontendSession } from "@/lib/auth/session";

export function AuthSessionSync() {
  useEffect(() => {
    let active = true;

    const syncSession = async () => {
      const profile = readFrontendProfile();
      if (profile) setFrontendSession(profile.id, profile);
      const api = createFrontendApiClient();
      const user = await api.me().catch(() => null);
      if (!active) return;
      if (user) setFrontendSession(profile?.id ?? user.id, user);
    };

    syncSession();

    return () => {
      active = false;
    };
  }, []);

  return null;
}
