// Dev-only one-tap sign-in, for click-through testing without typing a
// password (ported from Kinverse's local test sign-in, rebuilt on our
// cookie sessions). Off unless LOCAL_TEST_AUTH=true, never in production,
// and only for requests addressed to this machine.

export const LOCAL_TEST_EMAIL = "test@innerpause.local";
export const LOCAL_TEST_NAME = "Test listener";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]", "::1"]);

export function localTestAuthEnabled(env: Record<string, string | undefined>, requestUrl: string) {
  if (env.LOCAL_TEST_AUTH !== "true" || env.NODE_ENV === "production") return false;
  try {
    return LOOPBACK.has(new URL(requestUrl).hostname);
  } catch {
    return false;
  }
}
