// The server renders each sound twice (backend/src/renderer.ts): AAC in
// .m4a (Safari and iPhone, Chrome, Edge) and Opus in .webm, served at the
// same URL plus "/webm", for browsers without AAC (some Firefox and
// Chromium builds, VS Code's built-in browser).

export const AAC_TYPE = 'audio/mp4; codecs="mp4a.40.2"';
export const OPUS_TYPE = 'audio/webm; codecs="opus"';

export const webmUrl = (renderUrl: string) => `${renderUrl}/webm`;
export const isWebmUrl = (url: string) => url.endsWith("/webm");

// Some browsers claim AAC support they can't deliver (a Chromium build with
// a stripped-down decoder library), so a failed AAC file is remembered too.
let aacFailed = false;

export function markAacUnplayable() {
  aacFailed = true;
}

export function canPlayAac() {
  if (aacFailed || typeof document === "undefined") return !aacFailed;
  return document.createElement("audio").canPlayType(AAC_TYPE) !== "";
}

/** The rendering this browser should play. */
export const playableRenderUrl = (renderUrl: string) => (canPlayAac() ? renderUrl : webmUrl(renderUrl));
