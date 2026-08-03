import { validationError } from "../shared/errors.js";

export function validateCreateJournal(input: unknown) {
  if (!input || typeof input !== "object") throw validationError("Request body is required.");
  const body = input as Record<string, unknown>;
  const rawText = typeof body.rawText === "string" ? body.rawText.trim() : "";
  if (rawText.length < 3) throw validationError("Reflection text must contain at least 3 characters.");
  if (rawText.length > 10000) throw validationError("Reflection text is too long.");

  const emotionalIntensityBefore = body.emotionalIntensityBefore;
  if (
    emotionalIntensityBefore !== undefined &&
    (!Number.isInteger(emotionalIntensityBefore) || Number(emotionalIntensityBefore) < 1 || Number(emotionalIntensityBefore) > 10)
  ) {
    throw validationError("Emotional intensity must be between 1 and 10.");
  }

  return {
    rawText,
    title: typeof body.title === "string" ? body.title.trim().slice(0, 80) : rawText.slice(0, 58),
    transcription: typeof body.transcription === "string" ? body.transcription : undefined,
    emotionalIntensityBefore: emotionalIntensityBefore === undefined ? undefined : Number(emotionalIntensityBefore),
    idempotencyKey: typeof body.idempotencyKey === "string" ? body.idempotencyKey : undefined,
  };
}

