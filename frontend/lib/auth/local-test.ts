export function localTestAllowed(enabled: string | undefined, hostname: string, apiBaseUrl: string) {
  const loopback = new Set(['localhost', '127.0.0.1', '[::1]']);
  try {
    const api = new URL(apiBaseUrl);
    return enabled === 'true' && loopback.has(hostname) && loopback.has(api.hostname) && ['http:', 'https:'].includes(api.protocol);
  } catch { return false; }
}

// Only a separately built preview may use this. The preview gateway authenticates
// every request and supplies the test identity; this flag grants no API access.
export function sharedTestAllowed(enabled: string | undefined, origin: string, apiBaseUrl: string) {
  try {
    const page = new URL(origin);
    return enabled === 'true' && apiBaseUrl === '/api/v1' &&
      (page.protocol === 'https:' || (page.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(page.hostname)));
  } catch { return false; }
}
