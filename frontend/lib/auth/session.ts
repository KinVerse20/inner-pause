"use client";

import { InnerPauseApiClient } from "@/lib/api/client";
import { clearMvpAuthenticatedUser, setMvpAuthenticatedUser, upsertProfile } from "@/lib/mvp-storage";

const TOKEN_KEY = "innerpause-aws-access-token";
const ID_TOKEN_KEY = "innerpause-aws-id-token";
const REFRESH_TOKEN_KEY = "innerpause-aws-refresh-token";
const EXPIRES_AT_KEY = "innerpause-aws-token-expires-at";
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

export function getRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function isFrontendSessionExpired(bufferMs = 60_000) {
  if (typeof window === "undefined") return true;
  const expiresAt = Number(window.localStorage.getItem(EXPIRES_AT_KEY) ?? 0);
  return !expiresAt || Date.now() + bufferMs >= expiresAt;
}

export function setFrontendSession(
  token: string,
  profile: FrontendSessionProfile,
  options: { idToken?: string; refreshToken?: string; expiresAt?: number } = {},
) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  if (options.idToken) window.localStorage.setItem(ID_TOKEN_KEY, options.idToken);
  if (options.refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, options.refreshToken);
  if (options.expiresAt) window.localStorage.setItem(EXPIRES_AT_KEY, String(options.expiresAt));
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
  window.localStorage.removeItem(ID_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(EXPIRES_AT_KEY);
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
