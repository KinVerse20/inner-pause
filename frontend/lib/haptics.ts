// Haptic feedback — the "felt" half of every press (UI feedback system,
// app/globals.css .ds-tap). Three levels only, so the vocabulary stays calm:
//   tap      — a light acknowledgement for primary actions
//   success  — something was saved or completed
//   moment   — the start/end of a Pause (the product's key moments)
// Uses the Vibration API where available (Android/Chrome). iOS Safari has no
// web haptics; there the visual press state carries the feedback alone.
// Respects reduced motion as a proxy for "fewer sensory effects".

type HapticKind = "tap" | "success" | "moment";

const patterns: Record<HapticKind, number | number[]> = {
  tap: 8,
  success: [10, 40, 14],
  moment: [18, 60, 18],
};

export function haptic(kind: HapticKind = "tap") {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
  try {
    navigator.vibrate(patterns[kind]);
  } catch {
    // Some browsers throw when vibration is blocked by policy; feedback is optional.
  }
}
