"use client";

import { useEffect, useState } from "react";

import { PauseShell } from "@/components/pause-shell";
import { YouScreenHeader } from "@/components/settings-row";
import { ToggleSwitch } from "@/components/toggle-switch";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_CATEGORIES,
  getNotificationPreferences,
  setCategoryEnabled,
  setNotificationPermission,
  subscribeNotificationPreferences,
  type NotificationPreferencesState,
} from "@/lib/notification-preferences";

// You -> Notifications (docs/PRODUCT_FLOW.md §31): preference/state
// storage only — no real push infrastructure in this slice. Declining the
// prompt is respected and never re-pressured; this screen is always
// available to change the choice later regardless of the initial answer.
export function YouNotificationsScreen() {
  // SSR-safe default first, real localStorage value read post-mount — see
  // components/you-preferences-screen.tsx for why.
  const [state, setState] = useState<NotificationPreferencesState>(DEFAULT_NOTIFICATION_PREFERENCES);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(getNotificationPreferences());
    return subscribeNotificationPreferences(() => setState(getNotificationPreferences()));
  }, []);

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Notifications" />

        {state.permission === "not-asked" ? (
          <section className="space-y-3 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <p className="text-[0.9rem] font-semibold">Want Pause to occasionally bring you something good?</p>
            <p className="text-[0.82rem]" style={{ color: "var(--ds-text-secondary)" }}>
              Small reminders to breathe, notice, smile or slow down. They&apos;re not here to bring you back to the
              app — they&apos;re here to help you pause wherever you are.
            </p>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setNotificationPermission("enabled")}
                className="ds-tap min-h-11 rounded-full px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
              >
                Yes, send them
              </button>
              <button
                type="button"
                onClick={() => setNotificationPermission("declined")}
                className="ds-tap min-h-11 rounded-full border px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Not now
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-2.5 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
            <p className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
              {state.permission === "enabled" ? "Notifications are on." : "You said not now — that's respected."}
            </p>
            <button
              type="button"
              onClick={() => setNotificationPermission(state.permission === "enabled" ? "declined" : "enabled")}
              className="ds-tap min-h-9 rounded-full border px-4 text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
              style={{ borderColor: "var(--ds-border)" }}
            >
              {state.permission === "enabled" ? "Turn off" : "Turn on"}
            </button>
          </section>
        )}

        <section className="space-y-2">
          <h2 className="px-1 text-[0.72rem] font-semibold uppercase tracking-[0.06em]" style={{ color: "var(--ds-text-muted)" }}>
            Categories
          </h2>
          <div className="space-y-1 rounded-[var(--ds-radius-md)] px-4 py-1" style={{ background: "var(--ds-surface)" }}>
            {NOTIFICATION_CATEGORIES.map((category) => (
              <div key={category.id} className="flex items-center gap-3 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block text-[0.9rem] font-medium">{category.label}</span>
                  <span className="block text-[0.76rem]" style={{ color: "var(--ds-text-secondary)" }}>
                    {category.description}
                  </span>
                </span>
                <ToggleSwitch
                  checked={state.categories[category.id]}
                  onChange={(value) => setCategoryEnabled(category.id, value)}
                  label={category.label}
                />
              </div>
            ))}
          </div>
        </section>
      </div>
    </PauseShell>
  );
}
