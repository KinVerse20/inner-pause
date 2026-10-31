// A small in-memory limiter for the auth endpoints: it slows password
// guessing and reset-email floods without any extra service. Counts are per
// server process (they reset on restart, and each instance keeps its own),
// which is enough for a single API server.

const buckets = new Map<string, number[]>();
const MAX_KEYS = 50_000;

function recent(key: string, windowMs: number, now: number) {
  const kept = (buckets.get(key) ?? []).filter((time) => now - time < windowMs);
  if (kept.length) buckets.set(key, kept);
  else buckets.delete(key);
  return kept;
}

/** How many events `key` had within the window. */
export function countRecent(key: string, windowMs: number) {
  return recent(key, windowMs, Date.now()).length;
}

/** Records one event for `key`. */
export function recordEvent(key: string, windowMs: number) {
  const now = Date.now();
  const kept = recent(key, windowMs, now);
  // Never let the table grow without bound: drop the oldest keys first.
  if (!buckets.has(key) && buckets.size >= MAX_KEYS) {
    const oldest = buckets.keys().next().value;
    if (oldest !== undefined) buckets.delete(oldest);
  }
  buckets.set(key, [...kept, now]);
}

export function clearEvents(key: string) {
  buckets.delete(key);
}
