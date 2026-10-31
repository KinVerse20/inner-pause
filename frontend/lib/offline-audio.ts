"use client";

import { getVisibleCards } from "@/lib/content-store";
import { getPreferences } from "@/lib/preferences-store";
import { playableRenderUrl } from "@/lib/render-format";

// You → Preferences → "Make Pauses available offline": downloads every
// card's sound into the service worker's audio cache (public/sw.js), which
// serves it from there when there's no connection. Sounds played are cached
// too, offline setting or not; this downloads the rest ahead of time.

// Must match public/sw.js's AUDIO_CACHE and PAGE_CACHE.
const AUDIO_CACHE = "innerpause-v3-audio";
const PAGE_CACHE = "innerpause-v3-pages";

// The screens a Pause can need offline, besides each card's own screen.
const OFFLINE_PAGES = ["/", "/pause/player", "/practice", "/journey", "/tell", "/moments", "/profile"];

export interface OfflineDownloadResult {
  files: number;
  bytes: number;
}

const available = () => typeof window !== "undefined" && "caches" in window;

// A download can still be running when offline is switched off (the app
// refreshes downloads on load). It checks before every request, and clears
// up after itself if offline was switched off meanwhile: a sound already on
// its way is kept by the service worker as it passes through.
const stillWanted = () => getPreferences().offlineEnabled;

// The file each card sound would play right now: its rendering for the
// current Frequency setting, in a format this browser plays, else the
// original upload. None at all when Ambient sound is off.
function soundUrlsToDownload() {
  const preferences = getPreferences();
  if (!preferences.soundAmbientEnabled) return [];
  const urls = new Set<string>();
  for (const card of getVisibleCards()) {
    for (const sound of card.sounds) {
      const rendering = preferences.soundToneLayerEnabled ? sound.tunedUrl : sound.plainUrl;
      urls.add(rendering ? playableRenderUrl(rendering) : sound.url);
    }
  }
  return [...urls];
}

// Saves the main screens (moving around inside the app doesn't load pages
// in a way the service worker keeps), plus the scripts and styles they
// load — fetched through the service worker, which keeps every /_next/ file.
async function downloadPagesForOffline() {
  const cache = await caches.open(PAGE_CACHE);
  const paths = [...OFFLINE_PAGES, ...getVisibleCards().filter((card) => card.sounds.length > 0).map((card) => `/pause/${card.id}`)];
  const assets = new Set<string>();
  for (const path of paths) {
    if (!stillWanted()) return;
    const response = await fetch(path);
    if (!response.ok) continue;
    if (!stillWanted()) return;
    await cache.put(path, response.clone());
    const html = await response.text();
    for (const match of html.matchAll(/["'](\/_next\/static\/[^"']+\.(?:js|css))["']/g)) assets.add(match[1]);
  }
  await Promise.all([...assets].map((url) => fetch(url).catch(() => undefined)));
}

/** Saves the main screens and any card sound not stored yet. Resolves with the sounds stored. */
export async function downloadPauseSoundsForOffline(): Promise<OfflineDownloadResult> {
  if (!available()) throw new Error("This browser can't keep sounds for offline use.");
  await downloadPagesForOffline();
  const cache = await caches.open(AUDIO_CACHE);
  let files = 0;
  let bytes = 0;
  for (const url of soundUrlsToDownload()) {
    // Keyed by path, the way the service worker looks files up.
    const key = new URL(url, window.location.href).pathname;
    let stored = await cache.match(key);
    if (!stored) {
      if (!stillWanted()) break;
      const response = await fetch(url);
      if (!response.ok) continue;
      if (!stillWanted()) break;
      await cache.put(key, response);
      stored = await cache.match(key);
    }
    if (!stored) continue;
    files += 1;
    bytes += (await stored.blob()).size;
  }
  if (!stillWanted()) {
    await clearOfflineSounds();
    return { files: 0, bytes: 0 };
  }
  return { files, bytes };
}

/** Frees the space: removes every stored sound (played ones included) and saved screen. */
export async function clearOfflineSounds() {
  if (!available()) return;
  await caches.delete(AUDIO_CACHE);
  await caches.delete(PAGE_CACHE);
}
