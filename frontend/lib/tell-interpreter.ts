import { classifyTellInput, type BigMomentMode, type TellInterpretation } from "@inner-pause/shared";

import { apiFetch } from "@/lib/api";

export { buildReflection, classifyTellInput, tellChips } from "@inner-pause/shared";

export async function interpretTellInput(text: string, chips: string[], momentMode?: BigMomentMode): Promise<TellInterpretation> {
  const deterministic = classifyTellInput(text, chips, momentMode);
  if (deterministic.status === "confident") return deterministic;

  try {
    const response = await apiFetch("/api/tell-interpret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, chips, momentMode }),
      signal: AbortSignal.timeout(12000),
    });
    if (!response.ok) return deterministic;
    const payload = (await response.json()) as { result?: TellInterpretation };
    return payload.result ?? deterministic;
  } catch {
    return deterministic;
  }
}
