import { TARGET_LOUDNESS_LUFS, type PublicAppContent } from "@inner-pause/shared";
import { Hono } from "hono";

import { readContent } from "../content-store";
import { cardSoundRenderKeys, findRenders, renderUrl, type RenderDocument } from "../render-store";
import { coverUrl, findSoundsByIds, soundUrl } from "../sound-store";

export const contentRoutes = new Hono();

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
