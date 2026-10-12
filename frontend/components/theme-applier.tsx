"use client";

import { useEffect } from "react";

import { getPreferences, subscribePreferences } from "@/lib/preferences-store";

// Applies You -> Preferences -> Theme (docs/PRODUCT_FLOW.md §27) to the
// document root. "system" clears the attribute so app/globals.css's
// prefers-color-scheme media query keeps deciding; "light"/"dark" set an
// explicit override (app/globals.css's [data-theme] blocks). Mounted once
// in app/layout.tsx alongside the other cross-cutting providers.
export function ThemeApplier() {
  useEffect(() => {
    const apply = () => {
      const { theme } = getPreferences();
      if (theme === "system") delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = theme;
    };
    apply();
    return subscribePreferences(apply);
  }, []);

  return null;
}
