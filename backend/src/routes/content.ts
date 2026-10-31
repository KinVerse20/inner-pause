import {
  TARGET_LOUDNESS_LUFS,
  MAX_CARDS,
  MAX_SKILLS,
  cardIdFromLabel,
  cardInputSchema,
  cardOrderSchema,
  skillInputSchema,
  skillOrderSchema,
  type CardDefinition,
  type CardInput,
  type PublicAppContent,
  type SkillDefinition,
} from "@inner-pause/shared";
import { Hono, type Context } from "hono";

import { requireAdmin } from "../auth/admin";
import { readContent, writeCards, writeSkills } from "../content-store";
import { cardSoundRenderKeys, findRenders, renderUrl, type RenderDocument } from "../render-store";
import { coverUrl, findSoundsByIds, soundUrl } from "../sound-store";

export const contentRoutes = new Hono();

async function readJson(c: Context): Promise<unknown | undefined> {
  try {
    return await c.req.json();
  } catch {
    return undefined;
  }
}

/** Every sound a card lists must exist in the library. */
async function missingSound(input: CardInput) {
  const ids = input.sounds.map((item) => item.soundId);
  if (ids.length === 0) return false;
  return (await findSoundsByIds(ids)).length !== new Set(ids).size;
}

const invalid = (c: Context, error: string, issues?: unknown) => c.json({ error, ...(issues ? { issues } : {}) }, 400);

const readyUrl = (render: RenderDocument | undefined) => (render?.status === "ready" ? renderUrl(render._id) : null);

// How far the original is from the rendered loudness, from the plain
// rendering's measurement. Capped so a near-silent file isn't blown up.
function loudnessGainDb(plain: RenderDocument | undefined) {
  if (typeof plain?.inputLufs !== "number") return 0;
  return Math.round(Math.min(24, Math.max(-12, TARGET_LOUDNESS_LUFS - plain.inputLufs)) * 10) / 10;
}

// Public: every app load reads this to render Home's cards and apply admin
// overrides. Card sounds are resolved to playable URLs (the original and,
// once rendered, the tuned and plain renderings); sounds deleted since are
// dropped.
contentRoutes.get("/", async (c) => {
  const content = await readContent();
  const sounds = await findSoundsByIds(content.cards.flatMap((card) => card.sounds.map((item) => item.soundId)));
  const byId = new Map(sounds.map((sound) => [sound._id.toString(), sound]));
  const renders = await findRenders(
    content.cards.flatMap((card) => card.sounds.flatMap((item) => Object.values(cardSoundRenderKeys(card, item.soundId, item.volume)))),
  );

  const payload: PublicAppContent = {
    cards: content.cards.map((card) => ({
      ...card,
      sounds: card.sounds.flatMap((item) => {
        const sound = byId.get(item.soundId);
        if (!sound) return [];
        const keys = cardSoundRenderKeys(card, item.soundId, item.volume);
        const tuned = renders.get(keys.tuned);
        const plain = renders.get(keys.plain);
        return [
          {
            ...item,
            url: soundUrl(item.soundId),
            name: sound.name,
            description: sound.description ?? "",
            coverUrl: coverUrl(sound),
            tunedUrl: readyUrl(tuned),
            plainUrl: readyUrl(plain),
            renderStatus: tuned?.status === "ready" ? ("ready" as const) : tuned?.status === "failed" ? ("failed" as const) : ("pending" as const),
            gainDb: loudnessGainDb(plain),
          },
        ];
      }),
    })),
    skills: content.skills,
    updatedAt: content.updatedAt?.toISOString() ?? null,
  };
  return c.json(payload);
});

contentRoutes.post("/cards", requireAdmin, async (c) => {
  const parsed = cardInputSchema.safeParse(await readJson(c));
  if (!parsed.success) return invalid(c, "Invalid card.", parsed.error.issues);
  if (await missingSound(parsed.data)) return invalid(c, "One of the chosen sounds no longer exists.");

  const { cards } = await readContent();
  if (cards.length >= MAX_CARDS) return invalid(c, `There can be at most ${MAX_CARDS} cards.`);
  const card: CardDefinition = { ...parsed.data, id: cardIdFromLabel(parsed.data.label, cards.map((item) => item.id)), builtIn: false };
  await writeCards([...cards, card]);
  return c.json({ card }, 201);
});

contentRoutes.put("/cards/:id", requireAdmin, async (c) => {
  const id = c.req.param("id") ?? "";
  const parsed = cardInputSchema.safeParse(await readJson(c));
  if (!parsed.success) return invalid(c, "Invalid card.", parsed.error.issues);
  if (await missingSound(parsed.data)) return invalid(c, "One of the chosen sounds no longer exists.");

  const { cards } = await readContent();
  const existing = cards.find((card) => card.id === id);
  if (!existing) return c.json({ error: "Card not found." }, 404);
  const card: CardDefinition = { ...parsed.data, id: existing.id, builtIn: existing.builtIn };
  await writeCards(cards.map((item) => (item.id === id ? card : item)));
  return c.json({ card });
});

contentRoutes.delete("/cards/:id", requireAdmin, async (c) => {
  const id = c.req.param("id") ?? "";
  const { cards } = await readContent();
  const existing = cards.find((card) => card.id === id);
  if (!existing) return c.json({ error: "Card not found." }, 404);
  if (existing.builtIn) {
    return invalid(c, "The original six cards are used by Tell, Moments and Practice, so they can't be deleted. Hide it instead.");
  }
  await writeCards(cards.filter((card) => card.id !== id));
  return c.json({ ok: true });
});



contentRoutes.put("/cards-order", requireAdmin, async (c) => {
  const parsed = cardOrderSchema.safeParse(await readJson(c));
  if (!parsed.success) return invalid(c, "Invalid order.", parsed.error.issues);
  const { cards } = await readContent();
  const byId = new Map(cards.map((card) => [card.id, card]));
  const ids = parsed.data.ids;
  if (ids.length !== cards.length || new Set(ids).size !== ids.length || ids.some((id) => !byId.has(id))) {
    return invalid(c, "The order must list every card exactly once.");
  }
  await writeCards(ids.map((id) => byId.get(id)!));
  return c.json({ ok: true });
});

// ---------- Practice courses (skills) ----------

contentRoutes.post("/skills", requireAdmin, async (c) => {
  const parsed = skillInputSchema.safeParse(await readJson(c));
  if (!parsed.success) return invalid(c, "Invalid course.", parsed.error.issues);
  if (!parsed.data.course) return invalid(c, "A new course needs at least one session.");

  const { skills } = await readContent();
  if (skills.length >= MAX_SKILLS) return invalid(c, `There can be at most ${MAX_SKILLS} courses.`);
  // "session" is reserved: /practice/[id]/session is a route of its own.
  const id = cardIdFromLabel(parsed.data.label, [...skills.map((item) => item.id), "session"]);
  const skill: SkillDefinition = { ...parsed.data, id, builtIn: false };
  await writeSkills([...skills, skill]);
  return c.json({ skill }, 201);
});

contentRoutes.put("/skills/:id", requireAdmin, async (c) => {
  const id = c.req.param("id") ?? "";
  const parsed = skillInputSchema.safeParse(await readJson(c));
  if (!parsed.success) return invalid(c, "Invalid course.", parsed.error.issues);

  const { skills } = await readContent();
  const existing = skills.find((skill) => skill.id === id);
  if (!existing) return c.json({ error: "Course not found." }, 404);
  // Only an original can fall back to its built-in content.
  if (!parsed.data.course && !existing.builtIn) return invalid(c, "A custom course needs at least one session.");
  const skill: SkillDefinition = { ...parsed.data, id: existing.id, builtIn: existing.builtIn };
  await writeSkills(skills.map((item) => (item.id === id ? skill : item)));
  return c.json({ skill });
});

contentRoutes.delete("/skills/:id", requireAdmin, async (c) => {
  const id = c.req.param("id") ?? "";
  const { skills } = await readContent();
  const existing = skills.find((skill) => skill.id === id);
  if (!existing) return c.json({ error: "Course not found." }, 404);
  if (existing.builtIn) return invalid(c, "The original seven courses can't be deleted. Hide it instead.");
  await writeSkills(skills.filter((skill) => skill.id !== id));
  return c.json({ ok: true });
});

contentRoutes.put("/skills-order", requireAdmin, async (c) => {
  const parsed = skillOrderSchema.safeParse(await readJson(c));
  if (!parsed.success) return invalid(c, "Invalid order.", parsed.error.issues);
  const { skills } = await readContent();
  const byId = new Map(skills.map((skill) => [skill.id, skill]));
  const ids = parsed.data.ids;
  if (ids.length !== skills.length || new Set(ids).size !== ids.length || ids.some((id) => !byId.has(id))) {
    return invalid(c, "The order must list every course exactly once.");
  }
  await writeSkills(ids.map((id) => byId.get(id)!));
  return c.json({ ok: true });
});
