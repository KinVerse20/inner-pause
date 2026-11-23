// Dev-only one-tap sign-in (backend/src/auth/local-test.ts has the server
// half). The page shows only with NEXT_PUBLIC_LOCAL_TEST_AUTH=true, on this
// machine, talking to an API on this machine: an empty API base means the
// same origin, through next.config's /api rewrite.
const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function localTestAllowed(enabled: string | undefined, hostname: string, apiBase: string) {
  if (enabled !== "true" || !LOOPBACK.has(hostname)) return false;
  if (!apiBase) return true;
  try {
    const api = new URL(apiBase);
    return LOOPBACK.has(api.hostname) && (api.protocol === "http:" || api.protocol === "https:");
  } catch {
    return false;
  }
}
