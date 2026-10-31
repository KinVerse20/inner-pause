import { Hono, type Context } from "hono";

import { requireAdmin } from "../auth/admin";
import { TARGET_LOUDNESS_LUFS } from "@inner-pause/shared";

import { detachSound, readContent } from "../content-store";
import { cardSoundRenderKeys, deleteRendersForSound, findRender, isRenderKey, listRenders, renderUrl, type RenderDocument } from "../render-store";
import { fileStore } from "../file-store";
import { RENDER_FORMAT } from "../renderer";
import {
  MAX_COVER_BYTES,
  MAX_DESCRIPTION_LENGTH,
  MAX_SOUND_BYTES,
  deleteSound,
  findSound,
  listSounds,
  resolveAudioExtension,
  resolveImageExtension,
  saveSound,
  toSoundAsset,
  updateSound,
  type CoverUpload,
} from "../sound-store";

export const soundRoutes = new Hono();

type FormBody = Record<string, string | File>;

async function readForm(c: Context): Promise<FormBody | null> {
  try {
    return (await c.req.parseBody()) as FormBody;
  } catch {
    return null;
  }
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.trim().slice(0, max) : undefined);

/** Validates an optional cover image field; returns an error message, nothing, or the cover. */
async function readCover(value: unknown): Promise<CoverUpload | string | undefined> {
  if (!(value instanceof File) || value.size === 0) return undefined;
  if (value.size > MAX_COVER_BYTES) return `Cover images must be ${MAX_COVER_BYTES / 1024 / 1024} MB or smaller.`;
  const extension = resolveImageExtension(value.type, value.name);
  if (!extension) return "Unsupported cover image. Use JPG, PNG or WebP.";
  return { bytes: Buffer.from(await value.arrayBuffer()), extension };
}

// Streams a stored file, honouring Range requests so audio can seek/loop
// without re-downloading.
async function streamFile(c: Context, key: string, mimeType: string, cacheControl = "public, max-age=3600") {
  const store = fileStore();
  const size = await store.size(key);
  if (size === null) return c.json({ error: "File is missing." }, 404);

  const headers: Record<string, string> = {
    "Content-Type": mimeType,
    "Accept-Ranges": "bytes",
    "Cache-Control": cacheControl,
  };

  const range = /^bytes=(\d*)-(\d*)$/.exec(c.req.header("range") ?? "");
  if (range && (range[1] || range[2])) {
    const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
    const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
    if (start >= size || start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const stream = await store.read(key, { start, end });
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const stream = await store.read(key);
  return new Response(stream, { status: 200, headers: { ...headers, "Content-Length": String(size) } });
}

// Public: a rendered sound (backend/src/render-store.ts). A key names one
// exact rendering, so its file never changes and can be cached for good.
async function streamRender(c: Context, format: "m4a" | "webm") {
  const key = c.req.param("key") ?? "";
  const render = isRenderKey(key) ? await findRender(key) : null;
  const file = format === "webm" ? render?.storedAsWebm : render?.storedAs;
  if (render?.status !== "ready" || !file) return c.json({ error: "Rendering not found." }, 404);
  return streamFile(c, `renders/${file}`, format === "webm" ? "audio/webm" : "audio/mp4", "public, max-age=31536000, immutable");
}

soundRoutes.get("/renders/:key", (c) => streamRender(c, "m4a"));
// The same rendering as Opus, for browsers that can't play AAC.
soundRoutes.get("/renders/:key/webm", (c) => streamRender(c, "webm"));

// Public: the Pause Player streams these, the category screen shows covers.
soundRoutes.get("/:id/file", async (c) => {
  const sound = await findSound(c.req.param("id") ?? "");
  if (!sound) return c.json({ error: "Sound not found." }, 404);
  return streamFile(c, sound.storedAs, sound.mimeType);
});

soundRoutes.get("/:id/cover", async (c) => {
  const sound = await findSound(c.req.param("id") ?? "");
  if (!sound?.coverStoredAs || !sound.coverMimeType) return c.json({ error: "Cover not found." }, 404);
  return streamFile(c, sound.coverStoredAs, sound.coverMimeType);
});

// The library, each sound with its renderings and how far along they are.
// The admin screen polls this while anything is rendering.
soundRoutes.get("/", requireAdmin, async (c) => {
  const [sounds, renders, { cards }] = await Promise.all([listSounds(), listRenders(), readContent()]);
  const bySound = new Map<string, RenderDocument[]>();
  for (const render of renders) bySound.set(render.soundId, [...(bySound.get(render.soundId) ?? []), render]);
  // Which cards play each rendering.
  const cardsByKey = new Map<string, string[]>();
  for (const card of cards) {
    for (const item of card.sounds) {
      for (const key of Object.values(cardSoundRenderKeys(card, item.soundId, item.volume))) {
        cardsByKey.set(key, [...(cardsByKey.get(key) ?? []), card.label]);
      }
    }
  }
  return c.json({
    sounds: sounds.map((sound) => ({
      ...toSoundAsset(sound),
      renders: (bySound.get(sound._id.toString()) ?? []).map((render) => ({
        frequencyHz: render.frequencyHz,
        volume: render.volume,
        status: render.status,
        progress: render.status === "ready" ? 1 : (render.progress ?? 0),
        error: render.status === "failed" ? (render.error ?? "Rendering failed.") : null,
        url: render.status === "ready" ? renderUrl(render._id) : null,
        size: render.status === "ready" ? (render.size ?? null) : null,
        durationSeconds: render.status === "ready" ? (render.durationSeconds ?? null) : null,
        // Levelled to the target, then the card's volume applied.
        loudnessLufs:
          render.status === "ready" && render.volume > 0 ? Math.round((TARGET_LOUDNESS_LUFS + 20 * Math.log10(render.volume)) * 10) / 10 : null,
        format: RENDER_FORMAT,
        cards: cardsByKey.get(render._id) ?? [],
      })),
    })),
  });
});

soundRoutes.post("/", requireAdmin, async (c) => {
  const body = await readForm(c);
  if (!body) return c.json({ error: "Upload must be multipart form data." }, 400);

  const file = body.file;
  if (!(file instanceof File) || file.size === 0) {
    return c.json({ error: "Choose an audio file to upload." }, 400);
  }
  if (file.size > MAX_SOUND_BYTES) {
    return c.json({ error: `Audio files must be ${MAX_SOUND_BYTES / 1024 / 1024} MB or smaller.` }, 413);
  }
  const extension = resolveAudioExtension(file.type, file.name);
  if (!extension) {
    return c.json({ error: "Unsupported file type. Use WAV, FLAC, MP3, M4A, AAC, OGG or WebM." }, 415);
  }
  const cover = await readCover(body.cover);
  if (typeof cover === "string") return c.json({ error: cover }, 415);

  const doc = await saveSound({
    name: text(body.name, 80) || file.name.replace(/\.[^.]+$/, "").slice(0, 80),
    description: text(body.description, MAX_DESCRIPTION_LENGTH) ?? "",
    fileName: file.name,
    bytes: Buffer.from(await file.arrayBuffer()),
    extension,
    cover,
  });
  return c.json({ sound: toSoundAsset(doc) }, 201);
});

// Edit a sound's card: name, description, cover. The audio itself is
// replaced by uploading a new sound, not here.
soundRoutes.patch("/:id", requireAdmin, async (c) => {
  const sound = await findSound(c.req.param("id") ?? "");
  if (!sound) return c.json({ error: "Sound not found." }, 404);
  const body = await readForm(c);
  if (!body) return c.json({ error: "Edits must be multipart form data." }, 400);

  const name = text(body.name, 80);
  if (name === "") return c.json({ error: "A sound needs a name." }, 400);
  const cover = await readCover(body.cover);
  if (typeof cover === "string") return c.json({ error: cover }, 415);

  const updated = await updateSound(sound, {
    name,
    description: text(body.description, MAX_DESCRIPTION_LENGTH),
    cover,
    removeCover: body.removeCover === "true",
  });
  return c.json({ sound: updated ? toSoundAsset(updated) : null });
});

soundRoutes.delete("/:id", requireAdmin, async (c) => {
  const sound = await findSound(c.req.param("id") ?? "");
  if (!sound) return c.json({ error: "Sound not found." }, 404);
  // Renders first: stops one in progress, which may have the file open.
  await deleteRendersForSound(sound._id.toString());
  await deleteSound(sound);
  await detachSound(sound._id.toString());
  return c.json({ ok: true });
});
