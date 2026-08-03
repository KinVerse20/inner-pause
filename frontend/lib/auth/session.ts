"use client";

import { InnerPauseApiClient } from "@/lib/api/client";
import { clearMvpAuthenticatedUser, setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";

const TOKEN_KEY = "innerpause-aws-access-token";
const PROFILE_KEY = "innerpause-aws-profile";

export interface FrontendSessionProfile {
  id: string;
  email: string;
  fullName?: string;
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setFrontendSession(token: string, profile: FrontendSessionProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  setMvpAuthenticatedUser(profile.id);
  upsertProfile({
    fullName: profile.fullName ?? "",
    email: profile.email,
    onboardingCompleted: true,
  });
}

export function readFrontendProfile(): FrontendSessionProfile | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as FrontendSessionProfile;
  } catch {
    return null;
  }
}

export function clearFrontendSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(PROFILE_KEY);
  clearMvpAuthenticatedUser();
}

export function createFrontendApiClient(onUnauthorised?: () => void) {
  return new InnerPauseApiClient({
    getAccessToken,
    onUnauthorised: () => {
      clearFrontendSession();
      onUnauthorised?.();
    },
  });
}

