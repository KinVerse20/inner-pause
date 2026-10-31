const CACHE_VERSION = "innerpause-v3";
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const ASSET_CACHE = `${CACHE_VERSION}-assets`;
// Must match frontend/lib/offline-audio.ts, which downloads sounds into it.
const AUDIO_CACHE = `${CACHE_VERSION}-audio`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

// Pause sounds: the built-in tracks (/audio/), the server's renderings and
// original uploads. Each of these URLs always serves the same file (a
// rendering's key names its exact content; a new upload gets a new id), so
// caching on first play is safe, and makes played Pauses work offline.
const isPauseAudio = (pathname) =>
  pathname.startsWith("/audio/") ||
  pathname.startsWith("/api/sounds/renders/") ||
  /^\/api\/sounds\/[a-f0-9]{24}\/file$/.test(pathname);
const OFFLINE_URL = "/offline";

const APP_SHELL_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_ASSETS)),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_SHELL_CACHE, ASSET_CACHE, AUDIO_CACHE, PAGE_CACHE].includes(key))
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

const isAppNavigation = (request) =>
  request.mode === "navigate" ||
  (request.method === "GET" &&
    request.headers.get("accept")?.includes("text/html") &&
    !new URL(request.url).pathname.startsWith("/api/"));

const serveCachedRangeResponse = async (request, cachedResponse) => {
  const rangeHeader = request.headers.get("range");
  if (!rangeHeader) return cachedResponse;

  const arrayBuffer = await cachedResponse.arrayBuffer();
  const size = arrayBuffer.byteLength;
  const match = /bytes=(\d+)-(\d+)?/.exec(rangeHeader);

  if (!match) {
    return new Response(null, {
      status: 416,
      statusText: "Range Not Satisfiable",
      headers: { "Content-Range": `bytes */${size}` },
    });
  }

  const start = Number(match[1]);
  const end = Math.min(match[2] ? Number(match[2]) : size - 1, size - 1);
  if (start >= size || start > end) {
    return new Response(null, {
      status: 416,
      statusText: "Range Not Satisfiable",
      headers: { "Content-Range": `bytes */${size}` },
    });
  }
  const chunk = arrayBuffer.slice(start, end + 1);

  return new Response(chunk, {
    status: 206,
    statusText: "Partial Content",
    headers: {
      "Content-Length": String(end - start + 1),
      "Content-Range": `bytes ${start}-${end}/${size}`,
      "Accept-Ranges": "bytes",
      "Content-Type": cachedResponse.headers.get("Content-Type") || "audio/mpeg",
    },
  });
};

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isPauseAudio(url.pathname)) {
    event.respondWith(
      caches.open(AUDIO_CACHE).then(async (cache) => {
        const cached = await cache.match(url.pathname);
        if (cached) {
          return serveCachedRangeResponse(request, cached);
        }

        try {
          const response = await fetch(request);
          if (response.ok && !request.headers.get("range")) {
            cache.put(url.pathname, response.clone());
          } else if (request.headers.get("range")) {
            fetch(url.pathname)
              .then((fullResponse) => {
                if (fullResponse.ok) cache.put(url.pathname, fullResponse.clone());
              })
              .catch(() => {});
          }
          return response;
        } catch {
          return cached ? serveCachedRangeResponse(request, cached) : Response.error();
        }
      }),
    );
    return;
  }

  // Pages: network first. Each page loaded is kept, so pages visited
  // before open offline. The query string is ignored when offline, so any
  // /pause/player?session=... works once the player has been opened.
  if (isAppNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            caches.open(PAGE_CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          const pages = await caches.open(PAGE_CACHE);
          // ignoreVary: Next varies pages on its router headers, which
          // differ between a saved page and a later navigation to it.
          return (
            (await pages.match(request, { ignoreVary: true })) ||
            (await pages.match(request, { ignoreSearch: true, ignoreVary: true })) ||
            (await caches.match(OFFLINE_URL))
          );
        }),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/favicon.ico"
  ) {
    event.respondWith(
      caches.open(ASSET_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) {
          fetch(request)
            .then((response) => {
              if (response.ok) cache.put(request, response.clone());
            })
            .catch(() => {});
          return cached;
        }

        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      }),
    );
  }
});
