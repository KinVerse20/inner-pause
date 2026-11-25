import { Hono, type Context } from "hono";

import { fileStore } from "../file-store";
import { findRender, isRenderKey } from "../render-store";
import { findSound } from "../sound-store";

export const soundRoutes = new Hono();

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
