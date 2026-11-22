// Background art for the Home outcome tiles — one quiet motif per outcome,
// drawn in that outcome's tint at low opacity (BRAND_IDENTITY.md §4.4:
// tints accent, never fill). Sits behind the icon and label, bleeding off the
// tile's lower-right corner so each card feels crafted, not decorated.
// Admin-created cards fall back to the Harmony Form's rings.

const MOTIFS: Record<string, React.ReactNode> = {
  sleep: (
    <>
      <path d="M86 30a30 30 0 1 0 22 50 26 26 0 0 1-22-50Z" />
      <circle cx="44" cy="40" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="58" cy="24" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="34" cy="66" r="1.1" fill="currentColor" stroke="none" />
      <path d="M50 100c12-4 26-4 38 0s26 4 38 0" strokeDasharray="2 5" />
    </>
  ),
  reset: (
    <>
      <path d="M104 64a32 32 0 1 1-10-23" />
      <path d="M96 28v14H82" />
      <circle cx="72" cy="64" r="16" />
    </>
  ),
  focus: (
    <>
      <circle cx="80" cy="80" r="40" />
      <circle cx="80" cy="80" r="26" />
      <circle cx="80" cy="80" r="12" />
      <circle cx="80" cy="80" r="3" fill="currentColor" stroke="none" />
    </>
  ),
  confidence: (
    <>
      <path d="M60 116a44 44 0 0 1 88 0" />
      <path d="M104 64V38M78 72 64 50M130 72l14-22M58 96H34M150 96h24" />
      <path d="M86 116a18 18 0 0 1 36 0" />
    </>
  ),
  calm: (
    <>
      <path d="M20 60c14 0 14-8 28-8s14 8 28 8 14-8 28-8 14 8 28 8" />
      <path d="M20 78c14 0 14-8 28-8s14 8 28 8 14-8 28-8 14 8 28 8" />
      <path d="M20 96c14 0 14-8 28-8s14 8 28 8 14-8 28-8 14 8 28 8" />
      <path d="M20 114c14 0 14-8 28-8s14 8 28 8 14-8 28-8 14 8 28 8" />
    </>
  ),
  release: (
    <>
      <path d="M112 26C80 28 60 44 58 70c-1 18 12 28 26 22 20-9 26-34 28-66Z" />
      <path d="M46 112c14-24 32-44 56-60" />
      <path d="M40 58c-6 4-8 10-6 16M30 86c-5 2-7 6-6 10" strokeDasharray="1 5" />
    </>
  ),
};

const FALLBACK = (
  <>
    <circle cx="74" cy="76" r="34" />
    <circle cx="88" cy="70" r="32" />
    <circle cx="80" cy="88" r="30" />
  </>
);

export function TileMotif({ id }: { id: string }) {
  return (
    <svg
      viewBox="0 0 140 140"
      className="tile-motif pointer-events-none absolute -right-5 -top-5 h-[66%] w-[66%]"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {MOTIFS[id] ?? FALLBACK}
    </svg>
  );
}
