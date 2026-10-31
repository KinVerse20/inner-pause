import type { Context } from "hono";

/**
 * The request's JSON body when it is a plain object, else null: malformed
 * JSON, `null`, an array or a bare value. Routes answer null with a 400
 * instead of crashing on it.
 */
export async function readJsonObject(c: Context): Promise<Record<string, unknown> | null> {
  try {
    const value: unknown = await c.req.json();
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

/** A string field, trimmed and capped; anything else becomes "". */
export function stringField(value: unknown, maxLength = 10_000) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

export const invalidBody = (c: Context) => c.json({ error: "The request body must be a JSON object." }, 400);
