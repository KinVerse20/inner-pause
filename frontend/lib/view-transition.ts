// Tap-to-expand (React <ViewTransition>, styled in app/globals.css under
// "View transitions"). The thing you tap and the screen it opens share a
// name, so the browser grows one into the other; going back shrinks it.
// Browsers without the View Transitions API just swap, as before.

/** A view-transition-name must be a CSS identifier: ids like "moment:abc" are cleaned. */
export function vtName(prefix: string, id: string) {
  return `${prefix}-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/** Shared by the player and what opens it (a Home tile, the nav's Pause button). */
export const expandName = (from: string) => vtName("expand", from);

/** True where a tap-to-expand will actually run, so screens can drop their own entrance motion. */
export function viewTransitionsSupported() {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/** Navigation type for opening the player out of what was tapped: the page underneath holds still while it grows. */
export const EXPAND = ["expand"];

/**
 * How the page content moves on the next navigation, marked on <html> just
 * before it: "forward"/"back" slide it (drilling into a You page and coming
 * back), "hold" keeps it still beneath the player growing over it. CSS
 * names the content only while marked (".page-content" in app/globals.css),
 * since a name React set would drop the page from every other transition.
 * The mark clears itself, so later navigations just swap.
 */
export function markPageTransition(kind: "forward" | "back" | "hold") {
  const root = document.documentElement;
  root.dataset.pageTransition = kind;
  window.clearTimeout(markTimer);
  markTimer = window.setTimeout(() => {
    delete root.dataset.pageTransition;
  }, 900);
}
let markTimer = 0;
