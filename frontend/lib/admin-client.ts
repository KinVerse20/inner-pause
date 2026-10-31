import type { CardDefinition, CardInput, SkillDefinition, SkillInput, SoundAsset } from "@inner-pause/shared";

import { apiFetch } from "@/lib/api";

// Admin API calls (/admin). Every call requires a signed-in user whose
// email is in the backend's ADMIN_EMAILS — the backend enforces this; the
// UI only mirrors it.

async function readError(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string; issues?: Array<{ path?: unknown[]; message?: string }> };
    const issue = payload.issues?.[0];
    const where = issue?.path?.length ? ` (${issue.path.join(" › ")})` : "";
    return issue?.message ? `${payload.error ?? "Invalid input."} ${issue.message}${where}` : payload.error ?? "Something went wrong.";
  } catch {
    return `Request failed (${response.status}).`;
  }
}

async function send(path: string, init?: RequestInit) {
  const response = await apiFetch(path, init);
  if (!response.ok) throw new Error(await readError(response));
  return response;
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

export async function listSounds(): Promise<SoundAsset[]> {
  const payload = (await (await send("/api/sounds")).json()) as { sounds: SoundAsset[] };
  return payload.sounds;
}

export async function uploadSound(input: { name: string; description: string; file: File; cover?: File | null }): Promise<SoundAsset> {
  const form = new FormData();
  form.set("name", input.name);
  form.set("description", input.description);
  form.set("file", input.file);
  if (input.cover) form.set("cover", input.cover);
  const payload = (await (await send("/api/sounds", { method: "POST", body: form })).json()) as { sound: SoundAsset };
  return payload.sound;
}

export async function updateSound(
  id: string,
  input: { name: string; description: string; cover?: File | null; removeCover?: boolean },
): Promise<SoundAsset> {
  const form = new FormData();
  form.set("name", input.name);
  form.set("description", input.description);
  if (input.cover) form.set("cover", input.cover);
  if (input.removeCover) form.set("removeCover", "true");
  const payload = (await (await send(`/api/sounds/${id}`, { method: "PATCH", body: form })).json()) as { sound: SoundAsset };
  return payload.sound;
}

export async function deleteSound(id: string) {
  await send(`/api/sounds/${id}`, { method: "DELETE" });
}

export async function createCard(input: CardInput): Promise<CardDefinition> {
  const payload = (await (await send("/api/content/cards", json("POST", input))).json()) as { card: CardDefinition };
  return payload.card;
}

export async function updateCard(id: string, input: CardInput): Promise<CardDefinition> {
  const payload = (await (await send(`/api/content/cards/${id}`, json("PUT", input))).json()) as { card: CardDefinition };
  return payload.card;
}

export async function deleteCard(id: string) {
  await send(`/api/content/cards/${id}`, { method: "DELETE" });
}

export async function saveCardOrder(ids: string[]) {
  await send("/api/content/cards-order", json("PUT", { ids }));
}

export async function createSkill(input: SkillInput): Promise<SkillDefinition> {
  const payload = (await (await send("/api/content/skills", json("POST", input))).json()) as { skill: SkillDefinition };
  return payload.skill;
}

export async function updateSkill(id: string, input: SkillInput): Promise<SkillDefinition> {
  const payload = (await (await send(`/api/content/skills/${id}`, json("PUT", input))).json()) as { skill: SkillDefinition };
  return payload.skill;
}

export async function deleteSkill(id: string) {
  await send(`/api/content/skills/${id}`, { method: "DELETE" });
}

export async function saveSkillOrder(ids: string[]) {
  await send("/api/content/skills-order", json("PUT", { ids }));
}
