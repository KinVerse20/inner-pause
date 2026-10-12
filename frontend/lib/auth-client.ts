import { apiFetch } from "@/lib/api";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phone: string;
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

export async function getCurrentUser() {
  const response = await apiFetch("/api/auth/me");
  if (!response.ok) return null;
  const payload = (await response.json()) as { user: AuthUser | null };
  return payload.user ?? null;
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
