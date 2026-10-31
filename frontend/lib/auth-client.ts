import type { PassState } from "@inner-pause/shared";

import { apiFetch } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  /** Derived server-side from ADMIN_EMAILS; grants access to /admin. */
  isAdmin?: boolean;
  /** The account's Inner Pause Pass. */
  pass?: PassState;
}

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export async function signup(input: { email: string; password: string; fullName: string }) {
  const response = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
}

export async function login(input: { email: string; password: string }) {
  const response = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
}

export async function logout() {
  await apiFetch("/api/auth/logout", { method: "POST" });
}

/**
 * The signed-in user, or null when signed out. Throws when that can't be
 * known (server unreachable or erroring), so callers never mistake an
 * outage for a sign-out.
 */
export async function getCurrentUser() {
  const response = await apiFetch("/api/auth/me");
  if (!response.ok) throw new Error(await readError(response));
  const payload = (await response.json()) as { user: AuthUser | null };
  return payload.user ?? null;
}

/** Deletes the signed-in account on the server (You → Data & Privacy). */
export async function deleteServerAccount() {
  const response = await apiFetch("/api/auth/delete-account", { method: "POST" });
  if (!response.ok) throw new Error(await readError(response));
}

export async function requestPasswordReset(email: string) {
  const response = await apiFetch("/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function resetPassword(token: string, password: string) {
  const response = await apiFetch("/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
  if (!response.ok) throw new Error(await readError(response));
}

export async function updateProfile(input: { fullName?: string; phone?: string }) {
  const response = await apiFetch("/api/profile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await readError(response));
  const payload = (await response.json()) as { user: AuthUser };
  return payload.user;
}
