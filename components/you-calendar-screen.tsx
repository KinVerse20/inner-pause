"use client";

import { useEffect, useState } from "react";

import { PauseShell } from "@/components/pause-shell";
import { YouScreenHeader } from "@/components/settings-row";
import {
  DEFAULT_CALENDAR_CONNECTION,
  connectCalendarDev,
  disconnectCalendar,
  getCalendarConnection,
  subscribeCalendarConnection,
  type CalendarConnectionState,
} from "@/lib/calendar-connection";

// You -> Calendar (docs/PRODUCT_FLOW.md §32): a connection/settings state,
// not the real Google OAuth flow — that's later integration work
// (docs/TECHNICAL_ARCHITECTURE.md §14). Manual Big Moments never depend on
// this state either way.
export function YouCalendarScreen() {
  // SSR-safe default first, real localStorage value read post-mount — see
  // components/you-preferences-screen.tsx for why.
  const [connection, setConnection] = useState<CalendarConnectionState>(DEFAULT_CALENDAR_CONNECTION);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setConnection(getCalendarConnection());
    return subscribeCalendarConnection(() => setConnection(getCalendarConnection()));
  }, []);

  return (
    <PauseShell>
      <div className="space-y-6 pb-4 pt-2">
        <YouScreenHeader title="Calendar" />

        <section className="space-y-3 rounded-[var(--ds-radius-md)] px-4 py-4" style={{ background: "var(--ds-surface)" }}>
          <p className="text-[0.85rem]" style={{ color: "var(--ds-text-secondary)" }}>
            Let Pause know when something important is coming up. Calendar is context, not surveillance — it&apos;s
            never required, and manual Moments work exactly the same without it.
          </p>

          {connection.connected ? (
            <>
              <p className="text-[0.9rem] font-semibold" style={{ color: "var(--ds-success)" }}>
                Connected
              </p>
              <button
                type="button"
                onClick={() => disconnectCalendar()}
                className="ds-tap min-h-11 rounded-full border px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ borderColor: "var(--ds-border)" }}
              >
                Disconnect
              </button>
            </>
          ) : (
            <>
              <p className="text-[0.9rem] font-semibold">Not connected</p>
              <button
                type="button"
                onClick={() => connectCalendarDev()}
                className="ds-tap min-h-11 rounded-full px-5 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ds-accent)]"
                style={{ background: "var(--ds-accent)", color: "var(--ds-accent-on)" }}
              >
                Connect Google Calendar
              </button>
            </>
          )}
        </section>
      </div>
    </PauseShell>
  );
}
